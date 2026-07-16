import { createSupabaseServerClient } from "@/lib/supabase/server"
import { RESOURCES_PAGE_SIZE } from "@/lib/resources/constants"
import type {
  CategoryOption,
  ProviderOption,
  ResourceWithRelations,
} from "@/lib/resources/types"

export type ListResourcesResult = {
  resources: ResourceWithRelations[]
  total: number
  page: number
  pageSize: number
}

export async function listResources(
  page = 1,
  providerId?: string | null
): Promise<ListResourcesResult> {
  const supabase = await createSupabaseServerClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * RESOURCES_PAGE_SIZE

  let query = supabase
    .from("resources")
    .select(
      "*, providers(name), category_resources(category_id, sort_order, categories(name))",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + RESOURCES_PAGE_SIZE - 1)

  if (providerId) {
    query = query.eq("provider_id", providerId)
  }

  const { data, count, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    resources: (data ?? []) as ResourceWithRelations[],
    total: count ?? 0,
    page: safePage,
    pageSize: RESOURCES_PAGE_SIZE,
  }
}

export async function listProviders(): Promise<ProviderOption[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("providers")
    .select("id, name")
    .order("name")

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function listCategoriesForSelect(): Promise<CategoryOption[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name")

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}
