import type { Metadata } from "next"
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
import { categories } from "@/lib/data"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Categories",
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Categories"
        description="Organize resources into clear, reusable groups."
        actions={
          <Button>
            <Plus />
            Create category
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="border-border/60 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "font-medium",
                  category.status === "Active"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {category.status}
              </Badge>
            </CardHeader>
            <CardContent className="text-muted-foreground flex items-center justify-between text-sm">
              <span className="tabular-nums">{category.resources} resources</span>
              <span>Updated {category.updatedAt}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Category directory</CardTitle>
          <CardDescription>Flat list for quick scanning and edits</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead className="hidden md:table-cell">Resources</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} className="hover:bg-muted/40">
                  <TableCell className="pl-6">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-muted-foreground text-xs md:hidden">
                      {category.resources} resources
                    </div>
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">
                    {category.resources}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {category.updatedAt}
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
