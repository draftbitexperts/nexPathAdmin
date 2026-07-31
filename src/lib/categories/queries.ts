import { CATEGORIES_PAGE_SIZE } from "@/lib/categories/constants";
import type { Category } from "@/lib/categories/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type ListCategoriesResult = {
  categories: Category[];
  total: number;
  page: number;
  pageSize: number;
};

/** Escape LIKE wildcards so user input is treated literally. */
function sanitizeSearch(search: string | null | undefined): string | null {
  const trimmed = search?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/[%_,]/g, "");
}

export async function listCategories(
  page = 1,
  search?: string | null,
): Promise<ListCategoriesResult> {
  const supabase = getSupabaseBrowserClient();
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * CATEGORIES_PAGE_SIZE;
  const q = sanitizeSearch(search);

  let query = supabase
    .from("categories")
    .select(
      "*, category_resources(resource_id, sort_order, resources(title))",
      { count: "exact" },
    )
    .order("title");

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,subtitle.ilike.%${q}%,slug.ilike.%${q}%`,
    );
  }

  const { data, count, error } = await query.range(
    from,
    from + CATEGORIES_PAGE_SIZE - 1,
  );

  if (error) {
    throw new Error(error.message);
  }

  return {
    categories: (data ?? []) as Category[],
    total: count ?? 0,
    page: safePage,
    pageSize: CATEGORIES_PAGE_SIZE,
  };
}

export async function getCategory(id: string): Promise<Category | null> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Category | null;
}

export type { Category };
