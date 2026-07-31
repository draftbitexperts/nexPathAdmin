import { GOAL_CATEGORIES_PAGE_SIZE } from "@/lib/goal-categories/constants"
import type { GoalCategory } from "@/lib/goal-categories/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type ListGoalCategoriesResult = {
  goalCategories: GoalCategory[]
  total: number
  page: number
  pageSize: number
}

type GoalCategoryRow = Omit<GoalCategory, "task_count"> & {
  path_tasks?: { count: number }[] | null
}

function mapGoalCategory(row: GoalCategoryRow): GoalCategory {
  const { path_tasks, ...goalCategory } = row
  return {
    ...goalCategory,
    task_count: path_tasks?.[0]?.count ?? 0,
  }
}

export async function listGoalCategories(
  page = 1,
): Promise<ListGoalCategoriesResult> {
  const supabase = getSupabaseBrowserClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * GOAL_CATEGORIES_PAGE_SIZE

  const { data, count, error } = await supabase
    .from("goal_categories")
    .select("*, path_tasks(count)", { count: "exact" })
    .order("title")
    .range(from, from + GOAL_CATEGORIES_PAGE_SIZE - 1)

  if (error) throw new Error(error.message)

  return {
    goalCategories: ((data ?? []) as GoalCategoryRow[]).map(mapGoalCategory),
    total: count ?? 0,
    page: safePage,
    pageSize: GOAL_CATEGORIES_PAGE_SIZE,
  }
}

export async function getGoalCategory(
  id: string,
): Promise<GoalCategory | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("goal_categories")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as GoalCategory | null
}
