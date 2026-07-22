import { FolderOpen } from "lucide-react"
import { Link } from "react-router"

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
import { useDocumentTitle } from "@/hooks/use-document-title"
import { libraryCollections } from "@/lib/data"
import { cn } from "@/lib/utils"

function visibilityStyles(visibility: string) {
  switch (visibility) {
    case "Public":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-400"
    case "Internal":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function LibraryPage() {
  useDocumentTitle("Library")

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Library"
        actions={
          <Button nativeButton={false} render={<Link to="/dashboard/resources" />}>
            <FolderOpen />
            Browse resources
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Collections</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {libraryCollections.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total items</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {libraryCollections.reduce((sum, item) => sum + item.items, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Public packs</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {
                libraryCollections.filter((item) => item.visibility === "Public")
                  .length
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Collections</CardTitle>
          <CardDescription>Shared libraries curated by your team</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="hidden sm:table-cell">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {libraryCollections.map((collection) => (
                <TableRow key={collection.id} className="hover:bg-muted/40">
                  <TableCell className="pl-6 font-medium">
                    {collection.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {collection.owner}
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">
                    {collection.items}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-medium",
                        visibilityStyles(collection.visibility)
                      )}
                    >
                      {collection.visibility}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {collection.updatedAt}
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
