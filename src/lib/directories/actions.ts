import {
  type ActionResult,
  formatRlsMutationError,
  requireAuthenticatedClient,
} from "@/lib/supabase/require-auth"
import { normalizeStateCode } from "@/lib/locations/constants"

import type { DirectoryInput } from "@/lib/directories/types"

function formatMutationError(error: { message: string; code?: string }): string {
  const rls = formatRlsMutationError(error)
  if (rls !== error.message) return rls
  if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
    return "A directory with that name already exists in this state."
  }
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
  const state_code = normalizeStateCode(
    String(formData.get("state_code") ?? "")
  )
  const area_id = nullIfEmpty(String(formData.get("area_id") ?? ""))
  const is_juvenile_justice_centered =
    formData.get("is_juvenile_justice_centered") === "true"
  const is_active = formData.get("is_active") !== "false"

  if (!name) return "Name is required."
  if (!external_url) return "External URL is required."
  if (!state_code) return "State is required."

  return {
    name,
    description,
    external_url,
    state_code,
    area_id,
    is_juvenile_justice_centered,
    is_active,
  }
}

function toRowPayload(parsed: DirectoryInput) {
  return {
    name: parsed.name,
    description: nullIfEmpty(parsed.description),
    external_url: parsed.external_url,
    state_code: parsed.state_code,
    area_id: parsed.area_id,
    is_juvenile_justice_centered: parsed.is_juvenile_justice_centered,
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

/** Soft-delete: sets `is_active` to false. */
export async function deleteDirectory(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing directory id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("directories")
    .update({ is_active: false })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}
