import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { latestResources, type Resource } from "@/lib/data"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Resources",
}

function statusStyles(status: Resource["status"]) {
  switch (status) {
    case "Published":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    case "Draft":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400"
    case "Archived":
      return "bg-muted text-muted-foreground"
  }
}

export default function ResourcesPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Resources"
        description="Browse and manage every file in the NexPath library."
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/upload" />}
            >
              Upload
            </Button>
            <Button>
              <Plus />
              New resource
            </Button>
          </>
        }
      />

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>All resources</CardTitle>
          <CardDescription>
            {latestResources.length} shown · 2,847 total
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Downloads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestResources.map((resource) => (
                <TableRow key={resource.id} className="hover:bg-muted/40">
                  <TableCell className="pl-6 font-medium">
                    {resource.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {resource.category}
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">
                    {resource.downloads.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("font-medium", statusStyles(resource.status))}
                    >
                      {resource.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {resource.updatedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
