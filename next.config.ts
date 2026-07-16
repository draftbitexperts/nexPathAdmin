import type { NextConfig } from "next"
import path from "path"
import { fileURLToPath } from "url"

const root = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: {
    root,
  },
  env: {
    // Sandbox provides VITE_PUBLIC_* vars; map them to Next.js public prefix
    // so they are available to browser code as well.
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.VITE_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
  },
}

export default nextConfig
