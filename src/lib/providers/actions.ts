import {
  type ActionResult,
  formatRlsMutationError,
  requireAuthenticatedClient,
} from "@/lib/supabase/require-auth"

import type { ProviderInput } from "@/lib/providers/types"

function formatMutationError(error: { message: string; code?: string }): string {
  const rls = formatRlsMutationError(error)
  if (rls !== error.message) return rls
  if (
    error.code === "23503" ||
    /foreign key|still referenced|violates foreign key/i.test(error.message)
  ) {
    return (
      "This provider still has resources. Reassign or delete those resources " +
      "first, or set the provider to inactive instead."
    )
  }
  return error.message
}

function nullIfEmpty(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseProviderInput(formData: FormData): ProviderInput | string {
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const logo_url = String(formData.get("logo_url") ?? "").trim()
  const is_active = formData.get("is_active") !== "false"

  if (!name) return "Name is required."

  return {
    name,
    description,
    logo_url,
    is_active,
  }
}

function toRowPayload(parsed: ProviderInput) {
  return {
    name: parsed.name,
    description: nullIfEmpty(parsed.description),
    logo_url: nullIfEmpty(parsed.logo_url),
    is_active: parsed.is_active ?? true,
  }
}

export async function createProvider(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseProviderInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("providers")
    .insert(toRowPayload(parsed))
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true, id: data.id }
}

export async function updateProvider(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing provider id." }

  const parsed = parseProviderInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("providers")
    .update(toRowPayload(parsed))
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}

/** Prefer deactivating over hard delete when resources still reference the provider. */
export async function setProviderActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing provider id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("providers")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}

/**
 * Hard delete is blocked while resources reference the provider (FK restrict).
 * Prefer {@link setProviderActive} with `false` to hide instead.
 */
export async function deleteProvider(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing provider id." }

  const { supabase, error: authError } = await requireAuthenticatedClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase.from("providers").delete().eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  return { ok: true }
}
