import { getSupabaseBrowserClient } from "@/lib/supabase/client"
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

/** Escape LIKE wildcards so user input is treated literally. */
function sanitizeSearch(search: string | null | undefined): string | null {
  const trimmed = search?.trim()
  if (!trimmed) return null
  return trimmed.replace(/[%_,]/g, "")
}

export async function listResources(
  page = 1,
  providerId?: string | null,
  search?: string | null
): Promise<ListResourcesResult> {
  const supabase = getSupabaseBrowserClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * RESOURCES_PAGE_SIZE
  const q = sanitizeSearch(search)

  let query = supabase
    .from("resources")
    .select(
      "*, providers(name), category_resources(category_id, sort_order, categories(name))",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })

  if (providerId) {
    query = query.eq("provider_id", providerId)
  }

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,summary.ilike.%${q}%,carousel_label.ilike.%${q}%`
    )
  }

  const { data, count, error } = await query.range(
    from,
    from + RESOURCES_PAGE_SIZE - 1
  )

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

/** Active providers for resource forms and filters. */
export async function listProvidersForSelect(): Promise<ProviderOption[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("providers")
    .select("id, name")
    .eq("is_active", true)
    .order("name")

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function listCategoriesForSelect(): Promise<CategoryOption[]> {
  const supabase = getSupabaseBrowserClient()

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
