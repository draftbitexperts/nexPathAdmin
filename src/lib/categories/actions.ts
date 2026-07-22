import {
  type ActionResult,
  formatRlsMutationError,
  requireAuthenticatedClient,
} from "@/lib/supabase/require-auth"

import { slugify } from "@/lib/categories/constants"
import type { CategoryInput } from "@/lib/categories/types"

function formatMutationError(error: { message: string; code?: string }): string {
  const rls = formatRlsMutationError(error)
  if (rls !== error.message) return rls
  if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
    return "A category with that slug already exists."
  }
  return error.message
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

function toRowPayload(parsed: CategoryInput, { includeSlug }: { includeSlug: boolean }) {
  const row = {
    name: parsed.name,
    short_description: parsed.short_description,
    long_description: parsed.long_description,
    icon_key: parsed.icon_key,
    is_active: parsed.is_active ?? true,
  }

  if (includeSlug) {
    return { ...row, slug: parsed.slug }
  }

  return row
}

export async function createCategory(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseCategoryInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("categories")
    .insert(toRowPayload(parsed, { includeSlug: true }))
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true, id: data.id }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing category id." }

  const parsed = parseCategoryInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("categories")
    .update(toRowPayload(parsed, { includeSlug: false }))
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}

/** Prefer deactivating over hard delete — hide the category from the app. */
export async function setCategoryActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing category id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}

/**
 * Hard delete cascades to tasks and resource links.
 * Prefer {@link setCategoryActive} with `false` to hide instead.
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing category id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}
