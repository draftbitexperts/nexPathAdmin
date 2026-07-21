export type SupabaseConfig = {
  anonKey: string
  url: string
}

const SUPABASE_URL = "https://muwfvtwwmlhavidjwqhd.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11d2Z2dHd3bWxoYXZpZGp3cWhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTExNDQsImV4cCI6MjA5ODQ4NzE0NH0.ceKzwRCeT18ybd8NZ5FOxAOkXCNjo4i7MfztEA4-aLA"

/**
 * Returns the public credentials required by Supabase clients.
 *
 * The anonymous key identifies the project but does not bypass Row Level
 * Security. Never put a service-role key in client-side code.
 */
export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  }
}
