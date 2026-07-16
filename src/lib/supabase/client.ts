import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseConfig } from "@/lib/supabase/config"

let client: SupabaseClient | undefined

/** Returns the shared Supabase browser client for client components. */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    const { url, anonKey } = getSupabaseConfig()
    client = createBrowserClient(url, anonKey)
  }

  return client
}
