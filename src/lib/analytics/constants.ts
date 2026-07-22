import type { AnalyticsTab, EventKind } from "@/lib/analytics/types"

export const ANALYTICS_PAGE_SIZE = 25

export const USER_TIMELINE_LIMIT = 200

export const ANALYTICS_TAB_LABELS: Record<AnalyticsTab, string> = {
  events: "Events",
  users: "Users",
}

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  all: "All events",
  views: "Views only",
  actions: "Actions only",
}

/** Known screen IDs from the app analytics vocabulary. */
export const SCREEN_LABELS: Record<string, string> = {
  welcome: "Welcome",
  about_you: "Tell us about yourself",
  priorities: "Get Started",
  immediate_help: "Need immediate help",
  my_path: "My Path",
  explore: "Explore",
  resources: "Resources",
  resource_detail: "Resource detail",
  calendar: "Calendar",
}

export const SCREEN_OPTIONS = Object.keys(SCREEN_LABELS)

/** Common action event names for the filter dropdown. */
export const KNOWN_EVENT_NAMES = [
  "screen_viewed",
  "lets_go_tapped",
  "category_added_to_path",
] as const

export const SCREEN_VIEWED_EVENT = "screen_viewed"
