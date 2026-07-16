import {
  type ActionResult,
  formatRlsMutationError,
  requireAuthenticatedClient,
} from "@/lib/supabase/require-auth"

import type { DirectoryInput } from "@/lib/directories/types"

function formatMutationError(error: { message: string; code?: string }): string {
  const rls = formatRlsMutationError(error)
  if (rls !== error.message) return rls
  return error.message
}

function nullIfEmpty(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseDirectoryInput(formData: FormData): DirectoryInput | string {
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const external_url = String(formData.get("external_url") ?? "").trim()
  const icon_key = String(formData.get("icon_key") ?? "").trim()
  const sortOrderRaw = String(formData.get("sort_order") ?? "0").trim()
  const sort_order = Number(sortOrderRaw)
  const show_on_resources = formData.get("show_on_resources") !== "false"
  const is_active = formData.get("is_active") !== "false"

  if (!name) return "Name is required."
  if (!external_url) return "External URL is required."
  if (!Number.isFinite(sort_order)) return "Sort order must be a number."

  return {
    name,
    description,
    external_url,
    icon_key,
    sort_order,
    show_on_resources,
    is_active,
  }
}

function toRowPayload(parsed: DirectoryInput) {
  return {
    name: parsed.name,
    description: nullIfEmpty(parsed.description),
    external_url: nullIfEmpty(parsed.external_url),
    icon_key: nullIfEmpty(parsed.icon_key),
    sort_order: parsed.sort_order,
    show_on_resources: parsed.show_on_resources,
    is_active: parsed.is_active ?? true,
  }
}

export async function createDirectory(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseDirectoryInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("directories")
    .insert(toRowPayload(parsed))
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true, id: data.id }
}

export async function updateDirectory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing directory id." }

  const parsed = parseDirectoryInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("directories")
    .update(toRowPayload(parsed))
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}

export async function setDirectoryActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing directory id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("directories")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}

export async function deleteDirectory(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing directory id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase.from("directories").delete().eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}
