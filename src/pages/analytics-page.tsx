import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"

import { AnalyticsManager } from "@/components/analytics/analytics-manager"
import { PageHeader } from "@/components/dashboard/page-header"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { ANALYTICS_PAGE_SIZE } from "@/lib/analytics/constants"
import {
  getUserActivity,
  listAnalyticsEvents,
  resolveTargetLabels,
} from "@/lib/analytics/queries"
import {
  ANALYTICS_TABS,
  EVENT_KINDS,
  type AnalyticsEvent,
  type AnalyticsTab,
  type EventKind,
  type TimelineEvent,
  type UserDevice,
  type UserProfileSummary,
} from "@/lib/analytics/types"

function parseTab(value: string | null): AnalyticsTab {
  if (value && ANALYTICS_TABS.includes(value as AnalyticsTab)) {
    return value as AnalyticsTab
  }
  return "events"
}

function parseKind(value: string | null): EventKind {
  if (value && EVENT_KINDS.includes(value as EventKind)) {
    return value as EventKind
  }
  return "all"
}

export function AnalyticsPage() {
  useDocumentTitle("Analytics")
  const [searchParams] = useSearchParams()

  const tab = parseTab(searchParams.get("tab"))
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const eventName = searchParams.get("event")?.trim() || null
  const screen = searchParams.get("screen")?.trim() || null
  const kind = parseKind(searchParams.get("kind"))
  const from = searchParams.get("from")?.trim() || null
  const to = searchParams.get("to")?.trim() || null
  const filterUserId = searchParams.get("user")?.trim() || null
  const userId = searchParams.get("userId")?.trim() || null

  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(ANALYTICS_PAGE_SIZE)
  const [error, setError] = useState<string | null>(null)
  const [eventsLoading, setEventsLoading] = useState(true)

  const [profile, setProfile] = useState<UserProfileSummary | null>(null)
  const [devices, setDevices] = useState<UserDevice[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [eventsTargetLabels, setEventsTargetLabels] = useState<
    Record<string, string>
  >({})
  const [userTargetLabels, setUserTargetLabels] = useState<
    Record<string, string>
  >({})
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    setError(null)
    setEventsLoading(true)
    try {
      const result = await listAnalyticsEvents(page, {
        eventName,
        screen,
        kind,
        from,
        to,
        userId: filterUserId,
      })
      setEvents(result.events)
      setTotal(result.total)
      setPageSize(result.pageSize)
      setEventsTargetLabels(await resolveTargetLabels(result.events))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
      setEvents([])
      setTotal(0)
      setEventsTargetLabels({})
    } finally {
      setEventsLoading(false)
    }
  }, [page, eventName, screen, kind, from, to, filterUserId])

  const loadUserActivity = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setDevices([])
      setTimeline([])
      setUserTargetLabels({})
      setUserError(null)
      setUserLoading(false)
      return
    }

    setUserLoading(true)
    setUserError(null)
    try {
      const result = await getUserActivity(userId)
      setProfile(result.profile)
      setDevices(result.devices)
      setTimeline(result.events)
      setUserTargetLabels(await resolveTargetLabels(result.events))
    } catch (err) {
      setUserError(
        err instanceof Error ? err.message : "Failed to load user activity"
      )
      setProfile(null)
      setDevices([])
      setTimeline([])
      setUserTargetLabels({})
    } finally {
      setUserLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  useEffect(() => {
    if (tab === "users") {
      void loadUserActivity()
    }
  }, [tab, loadUserActivity])

  const targetLabels =
    tab === "users" ? userTargetLabels : eventsTargetLabels

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Analytics" />

      {tab === "events" && error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          Could not load analytics: {error}
        </div>
      ) : null}

      <AnalyticsManager
        tab={tab}
        events={events}
        total={total}
        page={page}
        pageSize={pageSize}
        eventName={eventName}
        screen={screen}
        kind={kind}
        from={from}
        to={to}
        filterUserId={filterUserId}
        userId={userId}
        profile={profile}
        devices={devices}
        timeline={timeline}
        targetLabels={targetLabels}
        eventsLoading={eventsLoading}
        userLoading={userLoading}
        userError={userError}
      />
    </div>
  )
}
