import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { AnalyticsManager } from "@/components/analytics/analytics-manager";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ANALYTICS_PAGE_SIZE } from "@/lib/analytics/constants";
import {
  listAnalyticsEvents,
  resolveTargetLabels,
} from "@/lib/analytics/queries";
import {
  ANALYTICS_DATE_RANGES,
  EVENT_KINDS,
  type AnalyticsDateRange,
  type AnalyticsEvent,
  type EventKind,
} from "@/lib/analytics/types";

function parseKind(value: string | null): EventKind {
  return value && EVENT_KINDS.includes(value as EventKind)
    ? (value as EventKind)
    : "all";
}

function parseDateRange(value: string | null): AnalyticsDateRange {
  return value && ANALYTICS_DATE_RANGES.includes(value as AnalyticsDateRange)
    ? (value as AnalyticsDateRange)
    : "all";
}

export function AnalyticsPage() {
  useDocumentTitle("Analytics");
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const eventName = searchParams.get("event")?.trim() || null;
  const screen = searchParams.get("screen")?.trim() || null;
  const kind = parseKind(searchParams.get("kind"));
  const dateRange = parseDateRange(searchParams.get("range"));
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(ANALYTICS_PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [targetLabels, setTargetLabels] = useState<Record<string, string>>({});

  const loadEvents = useCallback(async () => {
    setError(null);
    setEventsLoading(true);
    try {
      const result = await listAnalyticsEvents(page, {
        eventName,
        screen,
        kind,
        dateRange,
      });
      setEvents(result.events);
      setTotal(result.total);
      setPageSize(result.pageSize);
      setTargetLabels(await resolveTargetLabels(result.events));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
      setEvents([]);
      setTotal(0);
      setTargetLabels({});
    } finally {
      setEventsLoading(false);
    }
  }, [page, eventName, screen, kind, dateRange]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4 md:p-6 lg:p-8">
      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive shrink-0 rounded-xl border px-4 py-3 text-sm"
        >
          Could not load analytics: {error}
        </div>
      )}
      <AnalyticsManager
        {...{
          events,
          total,
          page,
          pageSize,
          eventName,
          screen,
          kind,
          dateRange,
          targetLabels,
          eventsLoading,
        }}
      />
    </div>
  );
}
