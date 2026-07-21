import { Navigate } from "react-router"

import { LoginPage } from "@/pages/login-page"
import { useAuth } from "@/lib/auth/auth-provider"

export default function LoginRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="bg-background flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <LoginPage />
}
