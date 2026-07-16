import type { LocationTab } from "@/lib/locations/types"

export const LOCATIONS_PAGE_SIZE = 20

export const LOCATION_TAB_LABELS: Record<LocationTab, string> = {
  states: "States",
  areas: "Areas",
  durations: "Community durations",
}

export function normalizeStateCode(value: string): string {
  return value.trim().toUpperCase().slice(0, 8)
}
