import { PROVIDERS_PAGE_SIZE } from "@/lib/providers/constants"
import type { Provider } from "@/lib/providers/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type ListProvidersResult = {
  providers: Provider[]
  total: number
  page: number
  pageSize: number
}

export async function listProvidersPage(
  page = 1
): Promise<ListProvidersResult> {
  const supabase = await createSupabaseServerClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * PROVIDERS_PAGE_SIZE

  const { data, count, error } = await supabase
    .from("providers")
    .select("*", { count: "exact" })
    .order("name")
    .range(from, from + PROVIDERS_PAGE_SIZE - 1)

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
  const supabase = await createSupabaseServerClient()

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
