export const GOAL_CATEGORIES_PAGE_SIZE = 20

export const GOAL_CATEGORY_ICON_KEYS = [
  "briefcase",
  "bus",
  "dollar-sign",
  "folder",
  "graduation-cap",
  "heart",
  "home",
  "phone",
  "scale",
] as const

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64)
}
