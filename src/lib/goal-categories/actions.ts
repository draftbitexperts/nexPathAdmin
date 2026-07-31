import {
  type ActionResult,
  formatRlsMutationError,
  requireAuthenticatedClient,
} from "@/lib/supabase/require-auth"
import { slugify } from "@/lib/goal-categories/constants"
import type { GoalCategoryInput } from "@/lib/goal-categories/types"

function formatMutationError(error: { message: string; code?: string }): string {
  const rls = formatRlsMutationError(error)
  if (rls !== error.message) return rls
  if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
    return "A goal category with that slug already exists."
  }
  return error.message
}

function parseGoalCategoryInput(
  formData: FormData,
): GoalCategoryInput | string {
  const title = String(formData.get("title") ?? "").trim()
  const slugRaw = String(formData.get("slug") ?? "").trim()
  const slug = slugify(slugRaw || title)

  if (!title) return "Title is required."
  if (!slug) return "Slug is required."

  return {
    slug,
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    icon_key: String(formData.get("icon_key") ?? "").trim(),
    is_active: formData.get("is_active") !== "false",
  }
}

export async function saveGoalCategory(
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseGoalCategoryInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("goal_categories")
    .upsert({
      ...(id ? { id } : {}),
      slug: parsed.slug,
      title: parsed.title,
      subtitle: parsed.subtitle || null,
      description: parsed.description || null,
      icon_key: parsed.icon_key || null,
      is_active: parsed.is_active,
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }
  return { ok: true, id: data.id }
}

/** Prefer deactivating over hard delete — hide the goal category from the app. */
export async function setGoalCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing goal category id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("goal_categories")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}

/**
 * Hard delete cascades to path tasks and their resource links.
 * Prefer {@link setGoalCategoryActive} with `false` to hide instead.
 */
export async function deleteGoalCategory(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing goal category id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("goal_categories")
    .delete()
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}
