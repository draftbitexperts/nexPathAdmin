import { Navigate, useLocation } from "react-router"

import { DashboardLayout } from "@/layouts/dashboard-layout"
import { useAuth } from "@/lib/auth/auth-provider"

export default function DashboardRoute() {
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

  return <DashboardLayout />
}
