import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/lib/auth/auth-provider"

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="bg-background flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    )
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return <Outlet />
}

export function GuestRoute() {
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

  return <Outlet />
}
