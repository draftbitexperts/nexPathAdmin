import type { ResourceImageMime, ResourceType } from "@/lib/resources/types"

export const RESOURCES_PAGE_SIZE = 20

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  website: "Website",
  hotline: "Hotline",
  youtube: "YouTube",
  text: "Text",
}

export const RESOURCE_IMAGES_BUCKET = "resource-images"

export const RESOURCE_IMAGE_MAX_BYTES = 2 * 1024 * 1024

export const RESOURCE_IMAGE_MIME_TYPES: readonly ResourceImageMime[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
]
