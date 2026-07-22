import {
  ANALYTICS_PAGE_SIZE,
  SCREEN_VIEWED_EVENT,
  USER_TIMELINE_LIMIT,
} from "@/lib/analytics/constants"
import {
  dateInputToEndIso,
  dateInputToStartIso,
} from "@/lib/analytics/format"
import type {
  AnalyticsEvent,
  AnalyticsEventFilters,
  AnalyticsEventProperties,
  TimelineEvent,
  UserDevice,
  UserProfileSummary,
} from "@/lib/analytics/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type ListAnalyticsEventsResult = {
  events: AnalyticsEvent[]
  total: number
  page: number
  pageSize: number
}

function normalizeProfile(
  profiles: AnalyticsEvent["profiles"]
): AnalyticsEvent["profiles"] {
  if (Array.isArray(profiles)) {
    return profiles[0] ?? null
  }
  return profiles
}

export async function listAnalyticsEvents(
  page = 1,
  filters: AnalyticsEventFilters = {}
): Promise<ListAnalyticsEventsResult> {
  const supabase = getSupabaseBrowserClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * ANALYTICS_PAGE_SIZE

  let query = supabase
    .from("analytics_events")
    .select(
      `
      id,
      occurred_at,
      event_name,
      properties,
      user_id,
      profiles ( state_code, area_id, onboarding_completed_at )
    `,
      { count: "exact" }
    )
    .order("occurred_at", { ascending: false })
    .range(from, from + ANALYTICS_PAGE_SIZE - 1)

  const eventName = filters.eventName?.trim()
  if (eventName) {
    query = query.eq("event_name", eventName)
  } else if (filters.kind === "views") {
    query = query.eq("event_name", SCREEN_VIEWED_EVENT)
  } else if (filters.kind === "actions") {
    query = query.neq("event_name", SCREEN_VIEWED_EVENT)
  }

  const screen = filters.screen?.trim()
  if (screen) {
    query = query.eq("properties->>screen", screen)
  }

  const userId = filters.userId?.trim()
  if (userId) {
    query = query.eq("user_id", userId)
  }

  const fromIso = dateInputToStartIso(filters.from)
  if (fromIso) {
    query = query.gte("occurred_at", fromIso)
  }

  const toIso = dateInputToEndIso(filters.to)
  if (toIso) {
    query = query.lte("occurred_at", toIso)
  }

  const { data, count, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const events = (data ?? []).map((row) => {
    const event = row as AnalyticsEvent
    return {
      ...event,
      profiles: normalizeProfile(event.profiles),
    }
  })

  return {
    events,
    total: count ?? 0,
    page: safePage,
    pageSize: ANALYTICS_PAGE_SIZE,
  }
}

export async function listUserTimeline(
  userId: string
): Promise<TimelineEvent[]> {
  const supabase = getSupabaseBrowserClient()
  const id = userId.trim()
  if (!id) return []

  const { data, error } = await supabase
    .from("analytics_events")
    .select("id, occurred_at, event_name, properties")
    .eq("user_id", id)
    .order("occurred_at", { ascending: false })
    .limit(USER_TIMELINE_LIMIT)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as TimelineEvent[]
}

export async function listUserDevices(userId: string): Promise<UserDevice[]> {
  const supabase = getSupabaseBrowserClient()
  const id = userId.trim()
  if (!id) return []

  const { data, error } = await supabase
    .from("user_devices")
    .select("id, platform, model, os_version, app_version, last_seen_at")
    .eq("user_id", id)
    .order("last_seen_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as UserDevice[]
}

export async function getUserProfileSummary(
  userId: string
): Promise<UserProfileSummary | null> {
  const supabase = getSupabaseBrowserClient()
  const id = userId.trim()
  if (!id) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("id, state_code, area_id, onboarding_completed_at")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as UserProfileSummary | null
}

export type UserActivityResult = {
  profile: UserProfileSummary | null
  devices: UserDevice[]
  events: TimelineEvent[]
}

export async function getUserActivity(
  userId: string
): Promise<UserActivityResult> {
  const id = userId.trim()
  if (!id) {
    return { profile: null, devices: [], events: [] }
  }

  const [profile, devices, events] = await Promise.all([
    getUserProfileSummary(id),
    listUserDevices(id),
    listUserTimeline(id),
  ])

  return { profile, devices, events }
}

function collectTargetIdsByType(
  events: { properties: AnalyticsEventProperties | null }[]
): Record<string, string[]> {
  const buckets = new Map<string, Set<string>>()

  for (const event of events) {
    const type = event.properties?.target_type
    const id = event.properties?.target_id
    if (typeof type !== "string" || !type.trim()) continue
    if (typeof id !== "string" || !id.trim()) continue

    const key = type.trim()
    const value = id.trim()
    const set = buckets.get(key) ?? new Set<string>()
    set.add(value)
    buckets.set(key, set)
  }

  return Object.fromEntries(
    [...buckets.entries()].map(([type, ids]) => [type, [...ids]])
  )
}

function targetLabelKey(type: string, id: string): string {
  return `${type}:${id}`
}

async function fetchNamedRows(
  table: string,
  ids: string[],
  nameColumn: "name" | "title"
): Promise<Record<string, string>> {
  if (ids.length === 0) return {}

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${nameColumn}`)
    .in("id", ids)

  if (error) {
    throw new Error(error.message)
  }

  return Object.fromEntries(
    (data ?? []).map((row) => {
      const record = row as Record<string, unknown>
      const id = String(record.id)
      const label = record[nameColumn]
      return [id, typeof label === "string" ? label : id]
    })
  )
}

/**
 * Resolve target_type + target_id to display titles for chips/timeline.
 * Keys are `${target_type}:${target_id}`.
 */
export async function resolveTargetLabels(
  events: { properties: AnalyticsEventProperties | null }[]
): Promise<Record<string, string>> {
  const byType = collectTargetIdsByType(events)
  const labels: Record<string, string> = {}

  const lookups: Array<Promise<void>> = []

  const categoryIds = byType.category ?? []
  if (categoryIds.length > 0) {
    lookups.push(
      fetchNamedRows("categories", categoryIds, "name").then((rows) => {
        for (const [id, name] of Object.entries(rows)) {
          labels[targetLabelKey("category", id)] = name
        }
      })
    )
  }

  const resourceIds = byType.resource ?? []
  if (resourceIds.length > 0) {
    lookups.push(
      fetchNamedRows("resources", resourceIds, "title").then((rows) => {
        for (const [id, title] of Object.entries(rows)) {
          labels[targetLabelKey("resource", id)] = title
        }
      })
    )
  }

  const directoryIds = byType.directory ?? []
  if (directoryIds.length > 0) {
    lookups.push(
      fetchNamedRows("directories", directoryIds, "name").then((rows) => {
        for (const [id, name] of Object.entries(rows)) {
          labels[targetLabelKey("directory", id)] = name
        }
      })
    )
  }

  const taskIds = byType.task ?? []
  if (taskIds.length > 0) {
    lookups.push(
      fetchNamedRows("path_tasks", taskIds, "title").then((rows) => {
        for (const [id, title] of Object.entries(rows)) {
          labels[targetLabelKey("task", id)] = title
        }
      })
    )
  }

  await Promise.all(lookups)
  return labels
}

export function getTargetLabel(
  type: string,
  id: string,
  labels?: Record<string, string>
): string | null {
  return labels?.[targetLabelKey(type, id)] ?? null
}
