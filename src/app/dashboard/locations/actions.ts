"use server"

import { revalidatePath } from "next/cache"

import { normalizeStateCode } from "@/lib/locations/constants"
import type {
  Area,
  AreaInput,
  CommunityDurationInput,
  StateAreaSyncItem,
  StateInput,
} from "@/lib/locations/types"
import { listAreasByState } from "@/lib/locations/queries"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type ActionResult =
  | { ok: true; id?: string; code?: string }
  | { ok: false; error: string }

function revalidateLocations() {
  revalidatePath("/dashboard/locations")
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
  if (error.code === "23505" || /duplicate|unique/i.test(error.message)) {
    return "That record already exists. Check for a duplicate name or code."
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

function parseSortOrder(raw: string): number | string {
  const sort_order = Number(raw.trim())
  if (!Number.isFinite(sort_order)) return "Sort order must be a number."
  return sort_order
}

function parseStateInput(
  formData: FormData,
  { requireCode }: { requireCode: boolean }
): StateInput | string {
  const code = normalizeStateCode(String(formData.get("code") ?? ""))
  const name = String(formData.get("name") ?? "").trim()
  const has_local_areas = formData.get("has_local_areas") !== "false"
  const sortOrderResult = parseSortOrder(
    String(formData.get("sort_order") ?? "0")
  )
  const is_active = formData.get("is_active") !== "false"

  if (requireCode && !code) return "Code is required."
  if (!name) return "Name is required."
  if (typeof sortOrderResult === "string") return sortOrderResult

  return {
    code,
    name,
    has_local_areas,
    sort_order: sortOrderResult,
    is_active,
  }
}

function parseAreaInput(formData: FormData): AreaInput | string {
  const state_code = normalizeStateCode(String(formData.get("state_code") ?? ""))
  const name = String(formData.get("name") ?? "").trim()
  const sortOrderResult = parseSortOrder(
    String(formData.get("sort_order") ?? "0")
  )
  const is_active = formData.get("is_active") !== "false"

  if (!state_code) return "State is required."
  if (!name) return "Name is required."
  if (typeof sortOrderResult === "string") return sortOrderResult

  return {
    state_code,
    name,
    sort_order: sortOrderResult,
    is_active,
  }
}

function parseDurationInput(
  formData: FormData
): CommunityDurationInput | string {
  const label = String(formData.get("label") ?? "").trim()
  const sortOrderResult = parseSortOrder(
    String(formData.get("sort_order") ?? "0")
  )
  const is_active = formData.get("is_active") !== "false"

  if (!label) return "Label is required."
  if (typeof sortOrderResult === "string") return sortOrderResult

  return {
    label,
    sort_order: sortOrderResult,
    is_active,
  }
}

/* ─── States ─── */

export async function createState(formData: FormData): Promise<ActionResult> {
  const parsed = parseStateInput(formData, { requireCode: true })
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase.from("states").insert({
    code: parsed.code,
    name: parsed.name,
    has_local_areas: parsed.has_local_areas,
    sort_order: parsed.sort_order,
    is_active: parsed.is_active ?? true,
  })

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true, code: parsed.code }
}

export async function updateState(
  code: string,
  formData: FormData
): Promise<ActionResult> {
  const stateCode = normalizeStateCode(code)
  if (!stateCode) return { ok: false, error: "Missing state code." }

  const parsed = parseStateInput(formData, { requireCode: false })
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("states")
    .update({
      name: parsed.name,
      has_local_areas: parsed.has_local_areas,
      sort_order: parsed.sort_order,
      is_active: parsed.is_active ?? true,
    })
    .eq("code", stateCode)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true }
}

export async function setStateActive(
  code: string,
  isActive: boolean
): Promise<ActionResult> {
  const stateCode = normalizeStateCode(code)
  if (!stateCode) return { ok: false, error: "Missing state code." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("states")
    .update({ is_active: isActive })
    .eq("code", stateCode)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true }
}

export async function deleteState(code: string): Promise<ActionResult> {
  const stateCode = normalizeStateCode(code)
  if (!stateCode) return { ok: false, error: "Missing state code." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error: areasError } = await supabase
    .from("areas")
    .delete()
    .eq("state_code", stateCode)

  if (areasError) return { ok: false, error: formatMutationError(areasError) }

  const { error } = await supabase
    .from("states")
    .delete()
    .eq("code", stateCode)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true }
}

/* ─── Areas ─── */

export async function createArea(formData: FormData): Promise<ActionResult> {
  const parsed = parseAreaInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("areas")
    .insert({
      state_code: parsed.state_code,
      name: parsed.name,
      sort_order: parsed.sort_order,
      is_active: parsed.is_active ?? true,
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true, id: data.id }
}

export async function updateArea(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing area id." }

  const parsed = parseAreaInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("areas")
    .update({
      name: parsed.name,
      sort_order: parsed.sort_order,
      is_active: parsed.is_active ?? true,
    })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true }
}

export async function setAreaActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing area id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("areas")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true }
}

export async function deleteArea(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing area id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase.from("areas").delete().eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true }
}

export async function fetchAreasForState(
  stateCode: string
): Promise<{ ok: true; areas: Area[] } | { ok: false; error: string }> {
  const code = normalizeStateCode(stateCode)
  if (!code) return { ok: false, error: "Missing state code." }

  try {
    const areas = await listAreasByState(code)
    return { ok: true, areas }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load areas.",
    }
  }
}

/**
 * Replace a state's areas: update kept rows, insert new ones, delete removed.
 */
export async function syncStateAreas(
  stateCode: string,
  areas: StateAreaSyncItem[]
): Promise<ActionResult> {
  const code = normalizeStateCode(stateCode)
  if (!code) return { ok: false, error: "Missing state code." }

  const cleaned: StateAreaSyncItem[] = []
  const seenNames = new Set<string>()

  for (const [index, area] of areas.entries()) {
    const name = area.name.trim()
    if (!name) return { ok: false, error: "Area name is required." }
    const nameKey = name.toLowerCase()
    if (seenNames.has(nameKey)) {
      return { ok: false, error: `Duplicate area name: ${name}` }
    }
    seenNames.add(nameKey)
    cleaned.push({
      id: area.id,
      name,
      sort_order: Number.isFinite(area.sort_order) ? area.sort_order : index,
      is_active: area.is_active ?? true,
    })
  }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data: existing, error: listError } = await supabase
    .from("areas")
    .select("id")
    .eq("state_code", code)

  if (listError) return { ok: false, error: formatMutationError(listError) }

  const keepIds = new Set(
    cleaned.map((area) => area.id).filter((id): id is string => Boolean(id))
  )
  const toDelete = (existing ?? [])
    .map((row) => row.id as string)
    .filter((id) => !keepIds.has(id))

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("areas")
      .delete()
      .in("id", toDelete)

    if (deleteError) return { ok: false, error: formatMutationError(deleteError) }
  }

  for (const area of cleaned) {
    if (area.id) {
      const { error } = await supabase
        .from("areas")
        .update({
          name: area.name,
          sort_order: area.sort_order,
          is_active: area.is_active ?? true,
        })
        .eq("id", area.id)
        .eq("state_code", code)

      if (error) return { ok: false, error: formatMutationError(error) }
    } else {
      const { error } = await supabase.from("areas").insert({
        state_code: code,
        name: area.name,
        sort_order: area.sort_order,
        is_active: area.is_active ?? true,
      })

      if (error) return { ok: false, error: formatMutationError(error) }
    }
  }

  revalidateLocations()
  return { ok: true }
}

/* ─── Community durations ─── */

export async function createCommunityDuration(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseDurationInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { data, error } = await supabase
    .from("community_durations")
    .insert({
      label: parsed.label,
      sort_order: parsed.sort_order,
      is_active: parsed.is_active ?? true,
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true, id: data.id }
}

export async function updateCommunityDuration(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing duration id." }

  const parsed = parseDurationInput(formData)
  if (typeof parsed === "string") return { ok: false, error: parsed }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("community_durations")
    .update({
      label: parsed.label,
      sort_order: parsed.sort_order,
      is_active: parsed.is_active ?? true,
    })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true }
}

export async function setCommunityDurationActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing duration id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("community_durations")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true }
}

export async function deleteCommunityDuration(
  id: string
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing duration id." }

  const { supabase, error: authError } = await requireAdminClient()
  if (authError || !supabase) return { ok: false, error: authError }

  const { error } = await supabase
    .from("community_durations")
    .delete()
    .eq("id", id)

  if (error) return { ok: false, error: formatMutationError(error) }

  revalidateLocations()
  return { ok: true }
}
