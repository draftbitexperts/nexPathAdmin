import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth/auth-provider"
import { Outlet } from "react-router-dom"

export function DashboardLayout() {
  const { user } = useAuth()

  const userName =
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (typeof user?.user_metadata?.name === "string" &&
      user.user_metadata.name) ||
    user?.email?.split("@")[0] ||
    null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <DashboardHeader userEmail={user?.email} userName={userName} />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
