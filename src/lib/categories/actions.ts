import {
  type ActionResult,
  formatRlsMutationError,
  requireAuthenticatedClient,
} from "@/lib/supabase/require-auth";

import { slugify } from "@/lib/categories/constants";
import type { CategoryInput } from "@/lib/categories/types";

function formatMutationError(error: {
  message: string;
  code?: string;
}): string {
  const rls = formatRlsMutationError(error);
  if (rls !== error.message) return rls;
  if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
    return "A category with that slug already exists.";
  }
  return error.message;
}

function parseCategoryInput(formData: FormData): CategoryInput | string {
  const title = String(formData.get("title") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugRaw || title);
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon_key = String(formData.get("icon_key") ?? "").trim();
  const is_active = formData.get("is_active") !== "false";

  if (!title) return "Title is required.";
  if (!slug) return "Slug is required.";
  if (!subtitle) return "Subtitle is required.";
  if (!description) return "Description is required.";
  if (!icon_key) return "Icon is required.";

  return {
    title,
    slug,
    subtitle,
    description,
    icon_key,
    is_active,
  };
}

function toRowPayload(
  parsed: CategoryInput,
  { includeSlug }: { includeSlug: boolean },
) {
  const row = {
    title: parsed.title,
    subtitle: parsed.subtitle || null,
    description: parsed.description || null,
    icon_key: parsed.icon_key,
    is_active: parsed.is_active ?? true,
  };

  if (includeSlug) {
    return { ...row, slug: parsed.slug };
  }

  return row;
}

export async function createCategory(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseCategoryInput(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { data, error } = await supabase
    .from("categories")
    .insert(toRowPayload(parsed, { includeSlug: true }))
    .select("id")
    .single();

  if (error) return { ok: false, error: formatMutationError(error) };

  return { ok: true, id: data.id };
}

export async function updateCategory(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing category id." };

  const parsed = parseCategoryInput(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { error } = await supabase
    .from("categories")
    .update(toRowPayload(parsed, { includeSlug: false }))
    .eq("id", id);

  if (error) return { ok: false, error: formatMutationError(error) };

  return { ok: true };
}

/** Replace all resource links for a category. */
export async function syncCategoryResourceLinks(
  categoryId: string,
  resourceIds: string[],
): Promise<ActionResult> {
  if (!categoryId) return { ok: false, error: "Missing category id." };

  const uniqueResourceIds = [...new Set(resourceIds.filter(Boolean))];
  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { error: deleteError } = await supabase
    .from("category_resources")
    .delete()
    .eq("category_id", categoryId);

  if (deleteError) {
    return { ok: false, error: formatMutationError(deleteError) };
  }

  if (uniqueResourceIds.length === 0) return { ok: true };

  const { error: insertError } = await supabase
    .from("category_resources")
    .insert(
      uniqueResourceIds.map((resource_id, sort_order) => ({
        category_id: categoryId,
        resource_id,
        sort_order,
      })),
    );

  if (insertError) {
    return { ok: false, error: formatMutationError(insertError) };
  }

  return { ok: true };
}

/** Prefer deactivating over hard delete — hide the category from the app. */
export async function setCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing category id." };

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { ok: false, error: formatMutationError(error) };

  return { ok: true };
}

/**
 * Hard delete cascades to tasks and resource links.
 * Prefer {@link setCategoryActive} with `false` to hide instead.
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing category id." };

  const { supabase, error: authError } = await requireAuthenticatedClient();
  if (authError || !supabase) return { ok: false, error: authError };

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return { ok: false, error: formatMutationError(error) };

  return { ok: true };
}
