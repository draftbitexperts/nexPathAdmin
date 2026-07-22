import {
  type ActionResult,
  formatRlsMutationError,
  requireAuthenticatedClient,
} from "@/lib/supabase/require-auth"

import {
  RESOURCE_IMAGES_BUCKET,
  RESOURCE_IMAGE_MAX_BYTES,
  RESOURCE_IMAGE_MIME_TYPES,
} from "@/lib/resources/constants"
import {
  RESOURCE_TYPES,
  type CategoryLinkInput,
  type ResourceImageMime,
  type ResourceInput,
  type ResourceType,
} from "@/lib/resources/types"

function formatMutationError(error: { message: string; code?: string }): string {
  const rls = formatRlsMutationError(error)
  if (rls !== error.message) return rls
  return error.message
}

function nullIfEmpty(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseResourceInput(formData: FormData): ResourceInput | string {
  const provider_id = String(formData.get("provider_id") ?? "").trim()
  const title = String(formData.get("title") ?? "").trim()
  const carousel_label = String(formData.get("carousel_label") ?? "").trim()
  const summary = String(formData.get("summary") ?? "").trim()
  const typeRaw = String(formData.get("type") ?? "").trim()
  const url = String(formData.get("url") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const video_id = String(formData.get("video_id") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  const is_active = formData.get("is_active") !== "false"

  if (!provider_id) return "Provider is required."
  if (!title) return "Title is required."
  if (!typeRaw) return "Type is required."
  if (!RESOURCE_TYPES.includes(typeRaw as ResourceType)) {
    return "Type must be website, hotline, youtube, or text."
  }

  const type = typeRaw as ResourceType

  if (type === "website" && !url) return "URL is required for website resources."
  if (type === "hotline" && !phone) {
    return "Phone is required for hotline resources."
  }
  if (type === "youtube" && !url && !video_id) {
    return "URL or video ID is required for YouTube resources."
  }
  if (type === "text" && !body) return "Body is required for text resources."

  return {
    provider_id,
    title,
    carousel_label,
    summary,
    type,
    url,
    phone,
    video_id,
    body,
    is_active,
  }
}

/** Only persist the payload field(s) that match the selected type. */
function toRowPayload(parsed: ResourceInput) {
  const base = {
    provider_id: parsed.provider_id,
    title: parsed.title,
    carousel_label: nullIfEmpty(parsed.carousel_label),
    summary: nullIfEmpty(parsed.summary),
    type: parsed.type,
    is_active: parsed.is_active ?? true,
    url: null as string | null,
    phone: null as string | null,
    video_id: null as string | null,
    body: null as string | null,
  }

  switch (parsed.type) {
    case "website":
      return { ...base, url: nullIfEmpty(parsed.url) }
    case "hotline":
      return { ...base, phone: nullIfEmpty(parsed.phone) }
    case "youtube":
      return {
        ...base,
        url: nullIfEmpty(parsed.url),
        video_id: nullIfEmpty(parsed.video_id),
      }
    case "text":
      return { ...base, body: nullIfEmpty(parsed.body) }
  }
}

function extForMime(mime: ResourceImageMime): string {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

function pathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/object/public/${RESOURCE_IMAGES_BUCKET}/`
  const i = publicUrl.indexOf(marker)
  if (i === -1) return null
  return decodeURIComponent(publicUrl.slice(i + marker.length))
}

async function removeStorageObjectFromPublicUrl(
  supabase: NonNullable<
    Awaited<ReturnType<typeof requireAuthenticatedClient>>["supabase"]
  >,
  publicUrl: string
): Promise<void> {
  const path = pathFromPublicUrl(publicUrl)
  if (!path) return
  await supabase.storage.from(RESOURCE_IMAGES_BUCKET).remove([path])
}

export async function createResource(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseResourceInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("resources")
    .insert(toRowPayload(parsed))
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true, id: data.id }
}

export async function updateResource(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing resource id." }

  const parsed = parseResourceInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("resources")
    .update(toRowPayload(parsed))
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}

export async function setResourceActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing resource id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("resources")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}

/**
 * Hard-delete a resource. Also removes its Storage thumbnail when present
 * so orphans do not pile up in the resource-images bucket.
 */
export async function deleteResource(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing resource id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data: existing, error: fetchError } = await supabase
    .from("resources")
    .select("image_url")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) return { ok: false, error: formatMutationError(fetchError) }

  const { error } = await supabase.from("resources").delete().eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  if (existing?.image_url) {
    await removeStorageObjectFromPublicUrl(supabase, existing.image_url)
  }

  return { ok: true }
}

/** Replace all category_resources links for a resource. */
export async function syncResourceCategoryLinks(
  resourceId: string,
  links: CategoryLinkInput[]
): Promise<ActionResult> {
  if (!resourceId) return { ok: false, error: "Missing resource id." }

  for (const link of links) {
    if (!link.category_id) {
      return { ok: false, error: "Each category link needs a category id." }
    }
  }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error: deleteError } = await supabase
    .from("category_resources")
    .delete()
    .eq("resource_id", resourceId)

  if (deleteError) return { ok: false, error: formatMutationError(deleteError) }

  if (links.length > 0) {
    const { error: insertError } = await supabase
      .from("category_resources")
      .insert(
        links.map((link) => ({
          category_id: link.category_id,
          resource_id: resourceId,
          sort_order: link.sort_order,
        }))
      )

    if (insertError) {
      return { ok: false, error: formatMutationError(insertError) }
    }
  }

  return { ok: true }
}

/**
 * Upload a thumbnail to resource-images, then store the public URL on the row.
 * Uses a new object path on every call so CDN caches stay fresh.
 */
export async function uploadResourceImage(
  resourceId: string,
  file: File
): Promise<ActionResult & { publicUrl?: string }> {
  if (!resourceId) return { ok: false, error: "Missing resource id." }

  const mime = file.type as ResourceImageMime
  if (!RESOURCE_IMAGE_MIME_TYPES.includes(mime)) {
    return {
      ok: false,
      error: "Image must be JPEG, PNG, or WebP.",
    }
  }
  if (file.size > RESOURCE_IMAGE_MAX_BYTES) {
    return { ok: false, error: "Image must be 2 MiB or smaller." }
  }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data: existing, error: fetchError } = await supabase
    .from("resources")
    .select("image_url")
    .eq("id", resourceId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: formatMutationError(fetchError) }

  const path = `${resourceId}/${crypto.randomUUID()}.${extForMime(mime)}`

  const { error: uploadError } = await supabase.storage
    .from(RESOURCE_IMAGES_BUCKET)
    .upload(path, file, {
      contentType: mime,
      upsert: false,
    })

  if (uploadError) {
    return { ok: false, error: formatMutationError(uploadError) }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(RESOURCE_IMAGES_BUCKET).getPublicUrl(path)

  const { error: updateError } = await supabase
    .from("resources")
    .update({ image_url: publicUrl })
    .eq("id", resourceId)

  if (updateError) {
    await supabase.storage.from(RESOURCE_IMAGES_BUCKET).remove([path])
    return { ok: false, error: formatMutationError(updateError) }
  }

  if (existing?.image_url) {
    await removeStorageObjectFromPublicUrl(supabase, existing.image_url)
  }

  return { ok: true, publicUrl }
}

/** Clear image_url and remove the Storage object. */
export async function clearResourceImage(
  resourceId: string
): Promise<ActionResult> {
  if (!resourceId) return { ok: false, error: "Missing resource id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data: existing, error: fetchError } = await supabase
    .from("resources")
    .select("image_url")
    .eq("id", resourceId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: formatMutationError(fetchError) }

  const { error: updateError } = await supabase
    .from("resources")
    .update({ image_url: null })
    .eq("id", resourceId)

  if (updateError) return { ok: false, error: formatMutationError(updateError) }

  if (existing?.image_url) {
    await removeStorageObjectFromPublicUrl(supabase, existing.image_url)
  }

  return { ok: true }
}
