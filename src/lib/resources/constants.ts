import type {
  ResourceImageMime,
  ResourceType,
  ResourceVideoMime,
} from "@/lib/resources/types";

export const RESOURCES_PAGE_SIZE = 20;

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  website: "Website",
  hotline: "Hotline",
  video: "Video",
  text: "Text",
};

export const RESOURCE_IMAGES_BUCKET = "resource-images";

export const RESOURCE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export const RESOURCE_IMAGE_MIME_TYPES: readonly ResourceImageMime[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const RESOURCE_VIDEOS_BUCKET = "resource_videos";

export const RESOURCE_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export const RESOURCE_VIDEO_MIME_TYPES: readonly ResourceVideoMime[] = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
