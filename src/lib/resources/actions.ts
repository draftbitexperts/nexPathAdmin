import {
  type ActionResult,
  formatRlsMutationError,
  requireAuthenticatedClient,
} from "@/lib/supabase/require-auth";

import {
  RESOURCE_IMAGES_BUCKET,
  RESOURCE_IMAGE_MAX_BYTES,
  RESOURCE_IMAGE_MIME_TYPES,
  RESOURCE_VIDEO_MAX_BYTES,
  RESOURCE_VIDEO_MIME_TYPES,
  RESOURCE_VIDEOS_BUCKET,
} from "@/lib/resources/constants";
import {
  RESOURCE_TYPES,
  type CategoryLinkInput,
  type ResourceImageMime,
  type ResourceInput,
  type ResourceType,
  type ResourceVideoMime,
} from "@/lib/resources/types";
import { slugify } from "@/lib/categories/constants";
import { isValidHttpUrl, normalizeHttpUrl } from "@/lib/utils";

function formatMutationError(error: {
  message: string;
  code?: string;
}): string {
  const rls = formatRlsMutationError(error);
  if (rls !== error.message) return rls;
  return error.message;
}

function nullIfEmpty(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseResourceInput(formData: FormData): ResourceInput | string {
  const provider_id = String(formData.get("provider_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "").trim();
  const website_url = String(formData.get("website_url") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const video_url = String(formData.get("video_url") ?? "").trim();
  const thumbnail_url = String(formData.get("thumbnail_url") ?? "").trim();
  const hasVideoUpload = formData.get("has_video_upload") === "true";
  const hasThumbnail = formData.get("has_thumbnail") === "true";
  const is_active = formData.get("is_active") !== "false";

  if (!provider_id) return "Provider is required.";
  if (!title) return "Title is required.";
  if (!description) return "Description is required.";
  if (!thumbnail_url && !hasThumbnail) return "Thumbnail is required.";
  if (!typeRaw) return "Type is required.";
  if (!RESOURCE_TYPES.includes(typeRaw as ResourceType)) {
    return "Type must be website, hotline, video, or text.";
  }

  const type = typeRaw as ResourceType;

  if (type === "website") {
    if (!website_url) return "Website URL is required for website resources.";
    if (!isValidHttpUrl(website_url)) return "Enter a valid website URL.";
  }
  if (type === "hotline" && !phone) {
    return "Phone is required for hotline resources.";
  }
  if (type === "hotline" && !/^\d+$/.test(phone)) {
    return "Phone must contain digits only.";
  }
  if (type === "video" && !video_url && !hasVideoUpload) {
    return "Video URL is required for video resources.";
  }
  if (type === "video" && video_url && !isValidHttpUrl(video_url)) {
    return "Enter a valid video URL.";
  }
  if (thumbnail_url && !isValidHttpUrl(thumbnail_url)) {
    return "Enter a valid thumbnail URL.";
  }

  return {
    provider_id,
    title,
    description,
    type,
    website_url: normalizeHttpUrl(website_url) ?? "",
    phone,
    video_url: normalizeHttpUrl(video_url) ?? "",
    thumbnail_url: normalizeHttpUrl(thumbnail_url) ?? "",
    is_active,
  };
}

/** Only persist the payload field(s) that match the selected type. */
function toRowPayload(parsed: ResourceInput) {
  const base = {
    provider_id: parsed.provider_id,
    title: parsed.title,
    description: nullIfEmpty(parsed.description),
    type: parsed.type,
    is_active: parsed.is_active ?? true,
    website_url: null as string | null,
    phone: null as string | null,
    video_url: null as string | null,
  };

  const withThumbnail = parsed.thumbnail_url
    ? { ...base, thumbnail: parsed.thumbnail_url }
    : base;

  switch (parsed.type) {
    case "website":
      return {
        ...withThumbnail,
        website_url: nullIfEmpty(parsed.website_url),
      };
    case "hotline":
      return { ...withThumbnail, phone: nullIfEmpty(parsed.phone) };
    case "video":
      return { ...withThumbnail, video_url: nullIfEmpty(parsed.video_url) };
    case "text":
      return withThumbnail;
  }
}

function extForMime(mime: ResourceImageMime): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function pathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/object/public/${RESOURCE_IMAGES_BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(publicUrl.slice(i + marker.length));
}

async function removeStorageObjectFromPublicUrl(
  supabase: NonNullable<
    Awaited<ReturnType<typeof requireAuthenticatedClient>>["supabase"]
  >,
  publicUrl: string,
): Promise<void> {
  const path = pathFromPublicUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(RESOURCE_IMAGES_BUCKET).remove([path]);
}

export async function createResource(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseResourceInput(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { data, error } = await supabase
    .from("resources")
    .insert(toRowPayload(parsed))
    .select("id")
    .single();

  if (error) return { ok: false, error: formatMutationError(error) };

  return { ok: true, id: data.id };
}

export async function updateResource(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing resource id." };

  const parsed = parseResourceInput(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { error } = await supabase
    .from("resources")
    .update(toRowPayload(parsed))
    .eq("id", id);

  if (error) return { ok: false, error: formatMutationError(error) };

  return { ok: true };
}

export async function setResourceActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing resource id." };

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { error } = await supabase
    .from("resources")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { ok: false, error: formatMutationError(error) };

  return { ok: true };
}

/**
 * Hard-delete a resource. Also removes its Storage thumbnail when present
 * so orphans do not pile up in the resource-images bucket.
 */
export async function deleteResource(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing resource id." };

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { data: existing, error: fetchError } = await supabase
    .from("resources")
    .select("thumbnail")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return { ok: false, error: formatMutationError(fetchError) };

  const { error } = await supabase.from("resources").delete().eq("id", id);

  if (error) return { ok: false, error: formatMutationError(error) };

  if (existing?.thumbnail) {
    await removeStorageObjectFromPublicUrl(supabase, existing.thumbnail);
  }

  return { ok: true };
}

/** Replace all category_resources links for a resource. */
export async function syncResourceCategoryLinks(
  resourceId: string,
  links: CategoryLinkInput[],
): Promise<ActionResult> {
  if (!resourceId) return { ok: false, error: "Missing resource id." };

  for (const link of links) {
    if (!link.category_id) {
      return { ok: false, error: "Each category link needs a category id." };
    }
  }

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { error: deleteError } = await supabase
    .from("category_resources")
    .delete()
    .eq("resource_id", resourceId);

  if (deleteError)
    return { ok: false, error: formatMutationError(deleteError) };

  if (links.length > 0) {
    const { error: insertError } = await supabase
      .from("category_resources")
      .insert(
        links.map((link) => ({
          category_id: link.category_id,
          resource_id: resourceId,
          sort_order: link.sort_order,
        })),
      );

    if (insertError) {
      return { ok: false, error: formatMutationError(insertError) };
    }
  }

  return { ok: true };
}

type NewResourceCategory = {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  icon_key: string;
};

/** Create a category from the resource workflow, then link it on save. */
export async function createResourceCategory(
  input: NewResourceCategory,
): Promise<ActionResult> {
  const trimmedTitle = input.title.trim();
  const slug = slugify(input.slug || trimmedTitle);
  const iconKey = input.icon_key.trim();
  if (!trimmedTitle) return { ok: false, error: "Category title is required." };
  if (!slug) return { ok: false, error: "Category slug is required." };
  if (!input.subtitle.trim()) {
    return { ok: false, error: "Category subtitle is required." };
  }
  if (!input.description.trim()) {
    return { ok: false, error: "Category description is required." };
  }
  if (!iconKey) return { ok: false, error: "Category icon is required." };

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { data, error } = await supabase
    .from("categories")
    .insert({
      slug,
      title: trimmedTitle,
      subtitle: nullIfEmpty(input.subtitle),
      description: nullIfEmpty(input.description),
      icon_key: iconKey,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: formatMutationError(error) };
  return { ok: true, id: data.id };
}

/**
 * Upload a thumbnail to resource-images, then store the public URL on the row.
 * Uses a new object path on every call so CDN caches stay fresh.
 */
export async function uploadResourceImage(
  resourceId: string,
  file: File,
): Promise<ActionResult & { publicUrl?: string }> {
  if (!resourceId) return { ok: false, error: "Missing resource id." };

  const mime = file.type as ResourceImageMime;
  if (!RESOURCE_IMAGE_MIME_TYPES.includes(mime)) {
    return {
      ok: false,
      error: "Image must be JPEG, PNG, or WebP.",
    };
  }
  if (file.size > RESOURCE_IMAGE_MAX_BYTES) {
    return { ok: false, error: "Image must be 2 MiB or smaller." };
  }

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { data: existing, error: fetchError } = await supabase
    .from("resources")
    .select("thumbnail")
    .eq("id", resourceId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: formatMutationError(fetchError) };

  const path = `${resourceId}/${crypto.randomUUID()}.${extForMime(mime)}`;

  const { error: uploadError } = await supabase.storage
    .from(RESOURCE_IMAGES_BUCKET)
    .upload(path, file, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: formatMutationError(uploadError) };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(RESOURCE_IMAGES_BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("resources")
    .update({ thumbnail: publicUrl })
    .eq("id", resourceId);

  if (updateError) {
    await supabase.storage.from(RESOURCE_IMAGES_BUCKET).remove([path]);
    return { ok: false, error: formatMutationError(updateError) };
  }

  if (existing?.thumbnail) {
    await removeStorageObjectFromPublicUrl(supabase, existing.thumbnail);
  }

  return { ok: true, publicUrl };
}

/** Clear thumbnail and remove the Storage object. */
export async function clearResourceImage(
  resourceId: string,
): Promise<ActionResult> {
  if (!resourceId) return { ok: false, error: "Missing resource id." };

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { data: existing, error: fetchError } = await supabase
    .from("resources")
    .select("thumbnail")
    .eq("id", resourceId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: formatMutationError(fetchError) };

  const { error: updateError } = await supabase
    .from("resources")
    .update({ thumbnail: null })
    .eq("id", resourceId);

  if (updateError)
    return { ok: false, error: formatMutationError(updateError) };

  if (existing?.thumbnail) {
    await removeStorageObjectFromPublicUrl(supabase, existing.thumbnail);
  }

  return { ok: true };
}

function extForVideoMime(mime: ResourceVideoMime): string {
  if (mime === "video/webm") return "webm";
  if (mime === "video/quicktime") return "mov";
  return "mp4";
}

/** Upload a video and save its public URL to the resource. */
export async function uploadResourceVideo(
  resourceId: string,
  file: File,
): Promise<ActionResult & { publicUrl?: string }> {
  if (!resourceId) return { ok: false, error: "Missing resource id." };

  const mime = file.type as ResourceVideoMime;
  if (!RESOURCE_VIDEO_MIME_TYPES.includes(mime)) {
    return { ok: false, error: "Video must be MP4, WebM, or QuickTime." };
  }
  if (file.size > RESOURCE_VIDEO_MAX_BYTES) {
    return { ok: false, error: "Video must be 100 MiB or smaller." };
  }

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const path = `${resourceId}/${crypto.randomUUID()}.${extForVideoMime(mime)}`;
  const { error: uploadError } = await supabase.storage
    .from(RESOURCE_VIDEOS_BUCKET)
    .upload(path, file, { contentType: mime, upsert: false });

  if (uploadError)
    return { ok: false, error: formatMutationError(uploadError) };

  const {
    data: { publicUrl },
  } = supabase.storage.from(RESOURCE_VIDEOS_BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("resources")
    .update({ video_url: publicUrl })
    .eq("id", resourceId);

  if (updateError) {
    await supabase.storage.from(RESOURCE_VIDEOS_BUCKET).remove([path]);
    return { ok: false, error: formatMutationError(updateError) };
  }

  return { ok: true, publicUrl };
}
