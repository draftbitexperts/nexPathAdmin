export const ANALYTICS_TABS = ["events", "users"] as const

export type AnalyticsTab = (typeof ANALYTICS_TABS)[number]

export const EVENT_KINDS = ["all", "views", "actions"] as const

export type EventKind = (typeof EVENT_KINDS)[number]

export type AnalyticsEventProperties = {
  screen?: string
  target_type?: string
  target_id?: string
  [key: string]: unknown
}

export type AnalyticsEventProfile = {
  state_code: string | null
  area_id: string | null
  onboarding_completed_at: string | null
}

export type AnalyticsEvent = {
  id: string
  occurred_at: string
  event_name: string
  properties: AnalyticsEventProperties | null
  user_id: string
  profiles: AnalyticsEventProfile | AnalyticsEventProfile[] | null
}

export type AnalyticsEventFilters = {
  eventName?: string | null
  screen?: string | null
  kind?: EventKind
  from?: string | null
  to?: string | null
  userId?: string | null
}

export type UserDevice = {
  id: string
  platform: string | null
  model: string | null
  os_version: string | null
  app_version: string | null
  last_seen_at: string | null
}

export type UserProfileSummary = {
  id: string
  state_code: string | null
  area_id: string | null
  onboarding_completed_at: string | null
}

export type TimelineEvent = {
  id: string
  occurred_at: string
  event_name: string
  properties: AnalyticsEventProperties | null
}
