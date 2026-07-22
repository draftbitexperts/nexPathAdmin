import { SCREEN_LABELS, SCREEN_VIEWED_EVENT } from "@/lib/analytics/constants"
import type { AnalyticsEventProperties } from "@/lib/analytics/types"

export function humanizeSnake(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function formatScreenLabel(screen: string | null | undefined): string {
  if (!screen) return "Unknown screen"
  return SCREEN_LABELS[screen] ?? humanizeSnake(screen)
}

export function formatEventTitle(
  eventName: string,
  properties: AnalyticsEventProperties | null | undefined
): string {
  if (eventName === SCREEN_VIEWED_EVENT) {
    return `Viewed ${formatScreenLabel(
      typeof properties?.screen === "string" ? properties.screen : null
    )}`
  }
  return humanizeSnake(eventName)
}

export function getEventScreen(
  properties: AnalyticsEventProperties | null | undefined
): string | null {
  return typeof properties?.screen === "string" ? properties.screen : null
}

export function getEventTarget(
  properties: AnalyticsEventProperties | null | undefined
): { type: string; id: string } | null {
  const type =
    typeof properties?.target_type === "string" ? properties.target_type : null
  const id =
    typeof properties?.target_id === "string" ? properties.target_id : null
  if (!type && !id) return null
  return { type: type ?? "target", id: id ?? "—" }
}

export function formatOccurredAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const diffMs = date.getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), "minute")
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), "hour")
  if (absMs < 30 * day) return rtf.format(Math.round(diffMs / day), "day")
  return formatOccurredAt(value)
}

export function shortId(id: string, chars = 8): string {
  if (id.length <= chars) return id
  return `${id.slice(0, chars)}…`
}

/** Start of local calendar day as ISO string, or null. */
export function dateInputToStartIso(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const date = new Date(`${trimmed}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/** End of local calendar day as ISO string, or null. */
export function dateInputToEndIso(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const date = new Date(`${trimmed}T23:59:59.999`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}
