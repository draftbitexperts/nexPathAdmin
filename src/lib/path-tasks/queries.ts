import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { PathTask } from "@/lib/path-tasks/types"

export const PATH_TASKS_PAGE_SIZE = 20

export type ListPathTasksResult = {
  tasks: PathTask[]
  total: number
  page: number
  pageSize: number
}

export async function listPathTasks(
  goalCategoryId: string,
  page = 1,
): Promise<ListPathTasksResult> {
  const supabase = getSupabaseBrowserClient()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * PATH_TASKS_PAGE_SIZE

  const { data, count, error } = await supabase
    .from("path_tasks")
    .select(
      "*, path_task_resources(resource_id, sort_order, resources(*, providers(name), category_resources(category_id, sort_order, categories(title))))",
      { count: "exact" },
    )
    .eq("goal_category_id", goalCategoryId)
    .order("sort_order")
    .range(from, from + PATH_TASKS_PAGE_SIZE - 1)

  if (error) throw new Error(error.message)

  return {
    tasks: (data ?? []) as PathTask[],
    total: count ?? 0,
    page: safePage,
    pageSize: PATH_TASKS_PAGE_SIZE,
  }
}

export async function listPathTaskResourceIds(taskId: string): Promise<string[]> {
  if (!taskId) return []

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("path_task_resources")
    .select("resource_id")
    .eq("path_task_id", taskId)
    .order("sort_order")

  if (error) throw new Error(error.message)
  return (data ?? []).map((link) => link.resource_id)
}
