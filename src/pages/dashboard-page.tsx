import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { LatestResourcesTable } from "@/components/dashboard/latest-resources-table"
import { PageHeader } from "@/components/dashboard/page-header"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { useDocumentTitle } from "@/hooks/use-document-title"

export function DashboardPage() {
  useDocumentTitle("Dashboard")

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Dashboard"
        description="Overview of resources, downloads, and activity across NexPath."
      />

      <StatsCards />

      <QuickActions />

      <DashboardCharts />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <LatestResourcesTable />
        </div>
        <div className="xl:col-span-2">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
