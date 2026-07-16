import { LOCATIONS_PAGE_SIZE } from "@/lib/locations/constants"
import type {
  Area,
  CommunityDuration,
  State,
  StateOption,
} from "@/lib/locations/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type ListStatesResult = {
  states: State[]
  total: number
  page: number
  pageSize: number
}

export type ListAreasResult = {
  areas: Area[]
  total: number
  page: number
  pageSize: number
}

export type ListCommunityDurationsResult = {
  durations: CommunityDuration[]
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

export async function listStates(
  page = 1,
  search?: string | null
): Promise<ListStatesResult> {
  const supabase = await createSupabaseServerClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * LOCATIONS_PAGE_SIZE
  const q = sanitizeSearch(search)

  let query = supabase
    .from("states")
    .select("*", { count: "exact" })
    .order("name")

  if (q) {
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%`)
  }

  const { data, count, error } = await query.range(
    from,
    from + LOCATIONS_PAGE_SIZE - 1
  )

  if (error) {
    throw new Error(error.message)
  }

  return {
    states: (data ?? []) as State[],
    total: count ?? 0,
    page: safePage,
    pageSize: LOCATIONS_PAGE_SIZE,
  }
}

export async function listStatesForSelect(): Promise<StateOption[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("states")
    .select("code, name, has_local_areas")
    .order("name")

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as StateOption[]
}

export async function listAreas(
  stateCode: string,
  page = 1,
  search?: string | null
): Promise<ListAreasResult> {
  const supabase = await createSupabaseServerClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * LOCATIONS_PAGE_SIZE
  const q = sanitizeSearch(search)

  let query = supabase
    .from("areas")
    .select("*", { count: "exact" })
    .eq("state_code", stateCode)
    .order("sort_order")

  if (q) {
    query = query.ilike("name", `%${q}%`)
  }

  const { data, count, error } = await query.range(
    from,
    from + LOCATIONS_PAGE_SIZE - 1
  )

  if (error) {
    throw new Error(error.message)
  }

  return {
    areas: (data ?? []) as Area[],
    total: count ?? 0,
    page: safePage,
    pageSize: LOCATIONS_PAGE_SIZE,
  }
}

/** All areas for a state (no pagination) — used when editing a state. */
export async function listAreasByState(stateCode: string): Promise<Area[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("areas")
    .select("*")
    .eq("state_code", stateCode)
    .order("sort_order")

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Area[]
}

export async function listCommunityDurations(
  page = 1,
  search?: string | null
): Promise<ListCommunityDurationsResult> {
  const supabase = await createSupabaseServerClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * LOCATIONS_PAGE_SIZE
  const q = sanitizeSearch(search)

  let query = supabase
    .from("community_durations")
    .select("*", { count: "exact" })
    .order("sort_order")

  if (q) {
    query = query.ilike("label", `%${q}%`)
  }

  const { data, count, error } = await query.range(
    from,
    from + LOCATIONS_PAGE_SIZE - 1
  )

  if (error) {
    throw new Error(error.message)
  }

  return {
    durations: (data ?? []) as CommunityDuration[],
    total: count ?? 0,
    page: safePage,
    pageSize: LOCATIONS_PAGE_SIZE,
  }
}

export type { Area, CommunityDuration, State, StateOption }
