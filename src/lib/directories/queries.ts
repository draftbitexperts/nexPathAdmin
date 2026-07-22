import { DIRECTORIES_PAGE_SIZE } from "@/lib/directories/constants"
import type {
  AreaOption,
  Directory,
  DirectoryWithRelations,
} from "@/lib/directories/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type ListDirectoriesResult = {
  directories: DirectoryWithRelations[]
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

export async function listDirectories(
  page = 1,
  search?: string | null
): Promise<ListDirectoriesResult> {
  const supabase = getSupabaseBrowserClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * DIRECTORIES_PAGE_SIZE
  const q = sanitizeSearch(search)

  let query = supabase
    .from("directories")
    .select("*, areas(name), states(name)", { count: "exact" })
    .order("name")

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data, count, error } = await query.range(
    from,
    from + DIRECTORIES_PAGE_SIZE - 1
  )

  if (error) {
    throw new Error(error.message)
  }

  return {
    directories: (data ?? []) as DirectoryWithRelations[],
    total: count ?? 0,
    page: safePage,
    pageSize: DIRECTORIES_PAGE_SIZE,
  }
}

export async function getDirectory(id: string): Promise<Directory | null> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("directories")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as Directory | null
}

/** Active areas for a state — used by the directory form. */
export async function listAreasForDirectorySelect(
  stateCode: string
): Promise<AreaOption[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("areas")
    .select("id, name")
    .eq("state_code", stateCode)
    .eq("is_active", true)
    .order("name")

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as AreaOption[]
}

export type { Directory, DirectoryWithRelations }
