"use server"

import { revalidatePath } from "next/cache"

import type { ProviderInput } from "@/lib/providers/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string }

function revalidateProviders() {
  revalidatePath("/dashboard/providers")
  revalidatePath("/dashboard/resources")
}

function formatMutationError(error: { message: string; code?: string }): string {
  if (
    error.code === "42501" ||
    /row-level security|security policies/i.test(error.message)
  ) {
    return (
      "Blocked by Row Level Security. Add SUPABASE_SERVICE_ROLE_KEY to .env " +
      "(Supabase → Project Settings → API → service_role) and restart the dev server, " +
      "or ask the backend project to grant write policies for authenticated admins."
    )
  }
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

async function requireAdminClient(): Promise<
  | {
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
      error: null
    }
  | { supabase: null; error: string }
> {
  const sessionClient = await createSupabaseServerClient()
  const {
    data: { user },
  } = await sessionClient.auth.getUser()

  if (!user) {
    return { supabase: null, error: "You must be signed in." }
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return { supabase: createSupabaseAdminClient(), error: null }
    } catch (err) {
      return {
        supabase: null,
        error: err instanceof Error ? err.message : "Admin client unavailable.",
      }
    }
  }

  return { supabase: sessionClient, error: null }
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

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("providers")
    .insert(toRowPayload(parsed))
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateProviders()
  return { ok: true, id: data.id }
}

export async function updateProvider(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing provider id." }

  const parsed = parseProviderInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("providers")
    .update(toRowPayload(parsed))
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateProviders()
  return { ok: true }
}

export async function setProviderActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing provider id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("providers")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateProviders()
  return { ok: true }
}

export async function deleteProvider(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing provider id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase.from("providers").delete().eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateProviders()
  return { ok: true }
}
