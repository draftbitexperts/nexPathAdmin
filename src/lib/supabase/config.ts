export type SupabaseConfig = {
  anonKey: string
  url: string
}

/**
 * Returns the public credentials required by Supabase clients.
 *
 * The anonymous key identifies the project but does not bypass Row Level
 * Security. Never put a service-role key in a public environment variable.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.VITE_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_*)."
    )
  }

  return { url, anonKey }
}
