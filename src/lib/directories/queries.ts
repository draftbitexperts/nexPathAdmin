import { DIRECTORIES_PAGE_SIZE } from "@/lib/directories/constants"
import type { Directory } from "@/lib/directories/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type ListDirectoriesResult = {
  directories: Directory[]
  total: number
  page: number
  pageSize: number
}

export async function listDirectories(
  page = 1
): Promise<ListDirectoriesResult> {
  const supabase = await createSupabaseServerClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * DIRECTORIES_PAGE_SIZE

  const { data, count, error } = await supabase
    .from("directories")
    .select("*", { count: "exact" })
    .order("sort_order")
    .range(from, from + DIRECTORIES_PAGE_SIZE - 1)

  if (error) {
    throw new Error(error.message)
  }

  return {
    directories: (data ?? []) as Directory[],
    total: count ?? 0,
    page: safePage,
    pageSize: DIRECTORIES_PAGE_SIZE,
  }
}

export async function getDirectory(id: string): Promise<Directory | null> {
  const supabase = await createSupabaseServerClient()

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

export type { Directory }
