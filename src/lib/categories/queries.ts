import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  CATEGORIES_PAGE_SIZE,
} from "@/lib/categories/constants"
import type {
  Category,
  CategoryPlacement,
  CategoryWithPlacements,
} from "@/lib/categories/types"

export type ListCategoriesResult = {
  categories: CategoryWithPlacements[]
  total: number
  page: number
  pageSize: number
}

export async function listCategories(
  page = 1
): Promise<ListCategoriesResult> {
  const supabase = getSupabaseBrowserClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * CATEGORIES_PAGE_SIZE

  const { data, count, error } = await supabase
    .from("categories")
    .select("*, category_placements(surface, sort_order)", { count: "exact" })
    .order("name")
    .range(from, from + CATEGORIES_PAGE_SIZE - 1)

  if (error) {
    throw new Error(error.message)
  }

  return {
    categories: (data ?? []) as CategoryWithPlacements[],
    total: count ?? 0,
    page: safePage,
    pageSize: CATEGORIES_PAGE_SIZE,
  }
}

export async function getCategory(
  id: string
): Promise<CategoryWithPlacements | null> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*, category_placements(surface, sort_order)")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as CategoryWithPlacements | null
}

export async function listPlacementsForCategory(
  categoryId: string
): Promise<Pick<CategoryPlacement, "surface" | "sort_order">[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("category_placements")
    .select("surface, sort_order")
    .eq("category_id", categoryId)
    .order("sort_order")

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export type { Category, CategoryPlacement, CategoryWithPlacements }
