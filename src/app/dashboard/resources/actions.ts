"use server"

import { revalidatePath } from "next/cache"

import {
  RESOURCE_TYPES,
  type CategoryLinkInput,
  type ResourceInput,
  type ResourceType,
} from "@/lib/resources/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string }

function revalidateResources() {
  revalidatePath("/dashboard/resources")
}

function formatMutationError(error: { message: string; code?: string }): string {
  if (
    error.code === "42501" ||
    /row-level security|security policies/i.test(error.message)
  ) {
    return (
      "Blocked by Row Level Security. Add SUPABASE_SERVICE_ROLE_KEY to .env " +
      "(Supabase → Project Settings → API → service_role) and restart the dev server, " +
      "or ask the backend project to grant write policies for authenticated admins."
    )
  }
  return error.message
}

async function requireAdminClient(): Promise<
  | {
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
      error: null
    }
  | { supabase: null; error: string }
> {
  const sessionClient = await createSupabaseServerClient()
  const {
    data: { user },
  } = await sessionClient.auth.getUser()

  if (!user) {
    return { supabase: null, error: "You must be signed in." }
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return { supabase: createSupabaseAdminClient(), error: null }
    } catch (err) {
      return {
        supabase: null,
        error: err instanceof Error ? err.message : "Admin client unavailable.",
      }
    }
  }

  return { supabase: sessionClient, error: null }
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
  const icon_key = String(formData.get("icon_key") ?? "").trim()
  const hero_image_url = String(formData.get("hero_image_url") ?? "").trim()
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
    icon_key,
    hero_image_url,
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
    icon_key: nullIfEmpty(parsed.icon_key),
    hero_image_url: nullIfEmpty(parsed.hero_image_url),
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

export async function createResource(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseResourceInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("resources")
    .insert(toRowPayload(parsed))
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateResources()
  return { ok: true, id: data.id }
}

export async function updateResource(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing resource id." }

  const parsed = parseResourceInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("resources")
    .update(toRowPayload(parsed))
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateResources()
  return { ok: true }
}

export async function setResourceActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing resource id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("resources")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateResources()
  return { ok: true }
}

export async function deleteResource(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing resource id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase.from("resources").delete().eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateResources()
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

  const { supabase, error: authError } = await requireAdminClient()
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

  revalidateResources()
  return { ok: true }
}
