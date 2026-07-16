export const CATEGORY_SURFACES = [
  "onboarding",
  "path_explore",
  "resources",
] as const

export type CategorySurface = (typeof CATEGORY_SURFACES)[number]

export type Category = {
  id: string
  slug: string
  name: string
  short_description: string | null
  long_description: string | null
  icon_key: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CategoryPlacement = {
  category_id: string
  surface: CategorySurface
  sort_order: number
}

export type CategoryWithPlacements = Category & {
  category_placements: Pick<CategoryPlacement, "surface" | "sort_order">[]
}

export type CategoryInput = {
  slug: string
  name: string
  short_description: string
  long_description: string
  icon_key: string
  is_active?: boolean
}

export type PlacementInput = {
  surface: CategorySurface
  sort_order: number
}
