import {
  type ActionResult,
  formatRlsMutationError,
  requireAuthenticatedClient,
} from "@/lib/supabase/require-auth"
import type { PathTaskInput } from "@/lib/path-tasks/types"

function formatMutationError(error: { message: string; code?: string }): string {
  const rls = formatRlsMutationError(error)
  return rls !== error.message ? rls : error.message
}

function parsePathTaskInput(formData: FormData): PathTaskInput | string {
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const sortOrder = Number(formData.get("sort_order") ?? 0)

  if (!title) return "Title is required."
  if (!description) return "Description is required."
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return "Sort order must be a non-negative whole number."
  }

  return {
    title,
    description,
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    completion_label: String(formData.get("completion_label") ?? "").trim(),
    uncompletion_label: String(formData.get("uncompletion_label") ?? "").trim(),
    sort_order: sortOrder,
    is_active: formData.get("is_active") !== "false",
  }
}

function toPayload(task: PathTaskInput) {
  return {
    title: task.title,
    description: task.description,
    subtitle: task.subtitle || null,
    completion_label: task.completion_label || null,
    uncompletion_label: task.uncompletion_label || null,
    sort_order: task.sort_order,
    is_active: task.is_active,
  }
}

export async function createPathTask(
  goalCategoryId: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!goalCategoryId) return { ok: false, error: "Missing goal category id." }
  const parsed = parsePathTaskInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("path_tasks")
    .insert({ goal_category_id: goalCategoryId, ...toPayload(parsed) })
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }
  return { ok: true, id: data.id }
}

export async function updatePathTask(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing path task id." }
  const parsed = parsePathTaskInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("path_tasks")
    .update(toPayload(parsed))
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }
  return { ok: true }
}

export async function deletePathTask(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing path task id." }
  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase.from("path_tasks").delete().eq("id", id)
  if (error) return { ok: false, error: formatMutationError(error) }
  return { ok: true }
}

export async function syncPathTaskResources(
  taskId: string,
  resourceIds: string[],
): Promise<ActionResult> {
  if (!taskId) return { ok: false, error: "Missing path task id." }
  const uniqueResourceIds = [...new Set(resourceIds.filter(Boolean))]
  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data: existing, error: listError } = await supabase
    .from("path_task_resources")
    .select("resource_id")
    .eq("path_task_id", taskId)
  if (listError) return { ok: false, error: formatMutationError(listError) }

  if (uniqueResourceIds.length > 0) {
    const { error: upsertError } = await supabase
      .from("path_task_resources")
      .upsert(
        uniqueResourceIds.map((resource_id, sort_order) => ({
          path_task_id: taskId,
          resource_id,
          sort_order,
        })),
      )
    if (upsertError) {
      return { ok: false, error: formatMutationError(upsertError) }
    }
  }

  const staleIds = (existing ?? [])
    .map((link) => link.resource_id)
    .filter((id) => !uniqueResourceIds.includes(id))
  for (const resourceId of staleIds) {
    const { error } = await supabase
      .from("path_task_resources")
      .delete()
      .eq("path_task_id", taskId)
      .eq("resource_id", resourceId)
    if (error) return { ok: false, error: formatMutationError(error) }
  }

  return { ok: true }
}
