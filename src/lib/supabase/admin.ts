import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseConfig } from "@/lib/supabase/config"

/**
 * Server-only Supabase client that uses the service role key.
 * Bypasses RLS for trusted admin mutations. Never import this into
 * client components or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const { url } = getSupabaseConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env (Supabase → Project Settings → API → service_role)."
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
