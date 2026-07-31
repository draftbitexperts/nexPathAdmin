import {
  ANALYTICS_PAGE_SIZE,
  SCREEN_VIEWED_EVENT,
} from "@/lib/analytics/constants";
import type {
  AnalyticsEvent,
  AnalyticsEventFilters,
  AnalyticsEventProperties,
} from "@/lib/analytics/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type ListAnalyticsEventsResult = {
  events: AnalyticsEvent[];
  total: number;
  page: number;
  pageSize: number;
};

function dateRangeStart(
  range: AnalyticsEventFilters["dateRange"],
): string | null {
  if (!range || range === "all") return null;

  const start = new Date();
  if (range === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (range === "week") {
    start.setDate(start.getDate() - 7);
  } else {
    start.setMonth(start.getMonth() - 1);
  }

  return start.toISOString();
}

export async function listAnalyticsEvents(
  page = 1,
  filters: AnalyticsEventFilters = {},
): Promise<ListAnalyticsEventsResult> {
  const supabase = getSupabaseBrowserClient();
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * ANALYTICS_PAGE_SIZE;

  let query = supabase
    .from("analytics_events")
    .select(
      `
      id,
      occurred_at,
      event_name,
      properties
    `,
      { count: "exact" },
    )
    .order("occurred_at", { ascending: false })
    .range(from, from + ANALYTICS_PAGE_SIZE - 1);

  const eventName = filters.eventName?.trim();
  if (eventName) {
    query = query.eq("event_name", eventName);
  } else if (filters.kind === "views") {
    query = query.eq("event_name", SCREEN_VIEWED_EVENT);
  } else if (filters.kind === "actions") {
    query = query.neq("event_name", SCREEN_VIEWED_EVENT);
  }

  const screen = filters.screen?.trim();
  if (screen) {
    query = query.eq("properties->>screen", screen);
  }

  const start = dateRangeStart(filters.dateRange);
  if (start) {
    query = query.gte("occurred_at", start);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    events: (data ?? []) as AnalyticsEvent[],
    total: count ?? 0,
    page: safePage,
    pageSize: ANALYTICS_PAGE_SIZE,
  };
}

function collectTargetIdsByType(
  events: { properties: AnalyticsEventProperties | null }[],
): Record<string, string[]> {
  const buckets = new Map<string, Set<string>>();

  for (const event of events) {
    const type = event.properties?.target_type;
    const id = event.properties?.target_id;
    if (typeof type !== "string" || !type.trim()) continue;
    if (typeof id !== "string" || !id.trim()) continue;

    const key = type.trim();
    const value = id.trim();
    const set = buckets.get(key) ?? new Set<string>();
    set.add(value);
    buckets.set(key, set);
  }

  return Object.fromEntries(
    [...buckets.entries()].map(([type, ids]) => [type, [...ids]]),
  );
}

function targetLabelKey(type: string, id: string): string {
  return `${type}:${id}`;
}

async function fetchNamedRows(
  table: string,
  ids: string[],
  nameColumn: "name" | "title",
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${nameColumn}`)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return Object.fromEntries(
    (data ?? []).map((row) => {
      const record = row as Record<string, unknown>;
      const id = String(record.id);
      const label = record[nameColumn];
      return [id, typeof label === "string" ? label : id];
    }),
  );
}

/**
 * Resolve target_type + target_id to display titles for chips/timeline.
 * Keys are `${target_type}:${target_id}`.
 */
export async function resolveTargetLabels(
  events: { properties: AnalyticsEventProperties | null }[],
): Promise<Record<string, string>> {
  const byType = collectTargetIdsByType(events);
  const labels: Record<string, string> = {};

  const lookups: Array<Promise<void>> = [];

  const categoryIds = byType.category ?? [];
  if (categoryIds.length > 0) {
    lookups.push(
      fetchNamedRows("categories", categoryIds, "title").then((rows) => {
        for (const [id, title] of Object.entries(rows)) {
          labels[targetLabelKey("category", id)] = title;
        }
      }),
    );
  }

  const resourceIds = byType.resource ?? [];
  if (resourceIds.length > 0) {
    lookups.push(
      fetchNamedRows("resources", resourceIds, "title").then((rows) => {
        for (const [id, title] of Object.entries(rows)) {
          labels[targetLabelKey("resource", id)] = title;
        }
      }),
    );
  }

  const directoryIds = byType.directory ?? [];
  if (directoryIds.length > 0) {
    lookups.push(
      fetchNamedRows("directories", directoryIds, "name").then((rows) => {
        for (const [id, name] of Object.entries(rows)) {
          labels[targetLabelKey("directory", id)] = name;
        }
      }),
    );
  }

  const taskIds = byType.task ?? [];
  if (taskIds.length > 0) {
    lookups.push(
      fetchNamedRows("path_tasks", taskIds, "title").then((rows) => {
        for (const [id, title] of Object.entries(rows)) {
          labels[targetLabelKey("task", id)] = title;
        }
      }),
    );
  }

  await Promise.all(lookups);
  return labels;
}

export function getTargetLabel(
  type: string,
  id: string,
  labels?: Record<string, string>,
): string | null {
  return labels?.[targetLabelKey(type, id)] ?? null;
}
