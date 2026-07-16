import type { CategorySurface } from "@/lib/categories/types"

export const CATEGORIES_PAGE_SIZE = 20

export const SURFACE_LABELS: Record<CategorySurface, string> = {
  onboarding: "Onboarding",
  path_explore: "My Path",
  resources: "Resources",
}

/** Lucide icon keys used in the mobile app / taxonomy. */
export const CATEGORY_ICON_KEYS = [
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
