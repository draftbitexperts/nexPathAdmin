import type { ResourceType } from "@/lib/resources/types"

export const RESOURCES_PAGE_SIZE = 20

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  website: "Website",
  hotline: "Hotline",
  youtube: "YouTube",
  text: "Text",
}
