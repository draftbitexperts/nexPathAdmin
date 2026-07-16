"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/categories/constants"
import {
  CATEGORY_SURFACES,
  type CategoryInput,
  type CategorySurface,
  type PlacementInput,
} from "@/lib/categories/types"

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string }

function revalidateCategories() {
  revalidatePath("/dashboard/categories")
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

/**
 * Require a signed-in dashboard user, then return a client that can write
 * taxonomy rows. Prefers the service-role admin client when configured;
 * otherwise uses the authenticated session (needs INSERT/UPDATE RLS policies).
 */
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

function parseCategoryInput(formData: FormData): CategoryInput | string {
  const name = String(formData.get("name") ?? "").trim()
  const slugRaw = String(formData.get("slug") ?? "").trim()
  const slug = slugify(slugRaw || name)
  const short_description = String(
    formData.get("short_description") ?? ""
  ).trim()
  const long_description = String(formData.get("long_description") ?? "").trim()
  const icon_key = String(formData.get("icon_key") ?? "").trim()
  const is_active = formData.get("is_active") !== "false"

  if (!name) return "Name is required."
  if (!slug) return "Slug is required."
  if (!icon_key) return "Icon is required."

  return {
    name,
    slug,
    short_description,
    long_description,
    icon_key,
    is_active,
  }
}

export async function createCategory(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseCategoryInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      slug: parsed.slug,
      name: parsed.name,
      short_description: parsed.short_description,
      long_description: parsed.long_description,
      icon_key: parsed.icon_key,
      is_active: parsed.is_active ?? true,
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateCategories()
  return { ok: true, id: data.id }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing category id." }

  const parsed = parseCategoryInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.name,
      short_description: parsed.short_description,
      long_description: parsed.long_description,
      icon_key: parsed.icon_key,
      is_active: parsed.is_active ?? true,
    })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateCategories()
  return { ok: true }
}

/** Prefer deactivating over hard delete — hide the category from surfaces. */
export async function setCategoryActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing category id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateCategories()
  return { ok: true }
}

/**
 * Hard delete cascades to placements, tasks, and links.
 * Prefer {@link setCategoryActive} with `false` to hide instead.
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing category id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateCategories()
  return { ok: true }
}

export async function upsertPlacement(
  categoryId: string,
  surface: CategorySurface,
  sortOrder: number
): Promise<ActionResult> {
  if (!categoryId) return { ok: false, error: "Missing category id." }
  if (!CATEGORY_SURFACES.includes(surface)) {
    return { ok: false, error: "Invalid surface." }
  }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase.from("category_placements").upsert({
    category_id: categoryId,
    surface,
    sort_order: sortOrder,
  })

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateCategories()
  return { ok: true }
}

export async function removePlacement(
  categoryId: string,
  surface: CategorySurface
): Promise<ActionResult> {
  if (!categoryId) return { ok: false, error: "Missing category id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("category_placements")
    .delete()
    .eq("category_id", categoryId)
    .eq("surface", surface)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateCategories()
  return { ok: true }
}

/** Replace all placements for a category in one round-trip. */
export async function syncCategoryPlacements(
  categoryId: string,
  placements: PlacementInput[]
): Promise<ActionResult> {
  if (!categoryId) return { ok: false, error: "Missing category id." }

  for (const placement of placements) {
    if (!CATEGORY_SURFACES.includes(placement.surface)) {
      return { ok: false, error: `Invalid surface: ${placement.surface}` }
    }
  }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error: deleteError } = await supabase
    .from("category_placements")
    .delete()
    .eq("category_id", categoryId)

  if (deleteError) return { ok: false, error: formatMutationError(deleteError) }

  if (placements.length > 0) {
    const { error: insertError } = await supabase
      .from("category_placements")
      .insert(
        placements.map((p) => ({
          category_id: categoryId,
          surface: p.surface,
          sort_order: p.sort_order,
        }))
      )

    if (insertError) {
      return { ok: false, error: formatMutationError(insertError) }
    }
  }

  revalidateCategories()
  return { ok: true }
}
