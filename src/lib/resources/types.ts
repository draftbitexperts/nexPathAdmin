export const RESOURCE_TYPES = ["website", "hotline", "video", "text"] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type Resource = {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  website_url: string | null;
  phone: string | null;
  video_url: string | null;
  thumbnail: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ResourceCategoryLink = {
  category_id: string;
  sort_order: number;
  categories: { title: string } | null;
};

export type ResourceWithRelations = Resource & {
  providers: { name: string } | null;
  category_resources: ResourceCategoryLink[];
};

export type ProviderOption = {
  id: string;
  name: string;
};

export type CategoryOption = {
  id: string;
  title: string;
};

export type ResourceOption = {
  id: string;
  title: string;
  providers: { name: string } | null;
};

export type ResourceInput = {
  provider_id: string;
  title: string;
  description: string;
  type: ResourceType;
  website_url: string;
  phone: string;
  video_url: string;
  thumbnail_url: string;
  is_active?: boolean;
};

export type CategoryLinkInput = {
  category_id: string;
  sort_order: number;
};

export type ResourceImageMime = "image/jpeg" | "image/png" | "image/webp";

export type ResourceVideoMime = "video/mp4" | "video/webm" | "video/quicktime";
