import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a URL for storage: trim, and prepend https:// when the scheme
 * is missing (e.g. `www.youtube.com` → `https://www.youtube.com`).
 * Returns null for empty input.
 */
export function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const url = new URL(candidate)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (!url.hostname) return null
    return url.href
  } catch {
    return null
  }
}

/** True when `value` is a parseable http(s) URL (scheme optional). */
export function isValidHttpUrl(value: string): boolean {
  return normalizeHttpUrl(value) !== null
}
