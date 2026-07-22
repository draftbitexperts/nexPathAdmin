export const RESOURCE_TYPES = [
  "website",
  "hotline",
  "youtube",
  "text",
] as const

export type ResourceType = (typeof RESOURCE_TYPES)[number]

export type Resource = {
  id: string
  provider_id: string
  title: string
  carousel_label: string | null
  summary: string | null
  type: ResourceType
  url: string | null
  phone: string | null
  video_id: string | null
  body: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ResourceCategoryLink = {
  category_id: string
  sort_order: number
  categories: { name: string } | null
}

export type ResourceWithRelations = Resource & {
  providers: { name: string } | null
  category_resources: ResourceCategoryLink[]
}

export type ProviderOption = {
  id: string
  name: string
}

export type CategoryOption = {
  id: string
  name: string
}

export type ResourceInput = {
  provider_id: string
  title: string
  carousel_label: string
  summary: string
  type: ResourceType
  url: string
  phone: string
  video_id: string
  body: string
  is_active?: boolean
}

export type CategoryLinkInput = {
  category_id: string
  sort_order: number
}

export type ResourceImageMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
