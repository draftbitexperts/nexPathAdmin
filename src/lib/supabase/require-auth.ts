import type { SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type ActionResult =
  | { ok: true; id?: string; code?: string }
  | { ok: false; error: string }

export async function requireAuthenticatedClient(): Promise<
  | { supabase: SupabaseClient; error: null }
  | { supabase: null; error: string }
> {
  const supabase = getSupabaseBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase: null, error: "You must be signed in." }
  }

  return { supabase, error: null }
}

export function formatRlsMutationError(error: {
  message: string
  code?: string
}): string {
  if (
    error.code === "42501" ||
    /row-level security|security policies/i.test(error.message)
  ) {
    return (
      "Blocked by Row Level Security. Ensure your Supabase project grants " +
      "write policies for authenticated admin users."
    )
  }
  return error.message
}
