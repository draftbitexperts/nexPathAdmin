import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabaseConfig } from "@/lib/supabase/config"

/**
 * Creates a request-scoped Supabase client for Server Components, Route
 * Handlers, and Server Actions. Do not cache this client across requests.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseConfig()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Components cannot modify response cookies. The session
          // refresh Proxy handles writing refreshed auth cookies.
        }
      },
    },
  })
}
