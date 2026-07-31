export const EVENT_KINDS = ["all", "views", "actions"] as const;

export type EventKind = (typeof EVENT_KINDS)[number];

export const ANALYTICS_DATE_RANGES = ["all", "today", "week", "month"] as const;

export type AnalyticsDateRange = (typeof ANALYTICS_DATE_RANGES)[number];

export type AnalyticsEventTarget = {
  id?: string;
  slug?: string | null;
  name?: string | null;
  title?: string | null;
  short_description?: string | null;
  [key: string]: unknown;
};

export type AnalyticsEventProperties = {
  screen?: string;
  target_type?: string;
  target_id?: string;
  target?: AnalyticsEventTarget | null;
  [key: string]: unknown;
};

export type AnalyticsEvent = {
  id: string;
  occurred_at: string;
  event_name: string;
  properties: AnalyticsEventProperties | null;
};

export type AnalyticsEventFilters = {
  eventName?: string | null;
  screen?: string | null;
  kind?: EventKind;
  dateRange?: AnalyticsDateRange;
};
