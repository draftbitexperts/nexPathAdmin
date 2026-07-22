import { PROVIDERS_PAGE_SIZE } from "@/lib/providers/constants"
import type { Provider } from "@/lib/providers/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type ListProvidersResult = {
  providers: Provider[]
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

export async function listProviders(
  page = 1,
  search?: string | null
): Promise<ListProvidersResult> {
  const supabase = getSupabaseBrowserClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * PROVIDERS_PAGE_SIZE
  const q = sanitizeSearch(search)

  let query = supabase
    .from("providers")
    .select("*", { count: "exact" })
    .order("name")

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data, count, error } = await query.range(
    from,
    from + PROVIDERS_PAGE_SIZE - 1
  )

  if (error) {
    throw new Error(error.message)
  }

  return {
    providers: (data ?? []) as Provider[],
    total: count ?? 0,
    page: safePage,
    pageSize: PROVIDERS_PAGE_SIZE,
  }
}

export async function getProvider(id: string): Promise<Provider | null> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as Provider | null
}

export type { Provider }
