import * as React from "react"
import { useNavigate } from "react-router"
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteResource,
  setResourceActive,
} from "@/lib/resources/actions"
import { ResourceFormSheet } from "@/components/resources/resource-form-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { categoryIcon } from "@/lib/categories/icons"
import { RESOURCE_TYPE_LABELS } from "@/lib/resources/constants"
import type {
  CategoryOption,
  ProviderOption,
  ResourceWithRelations,
} from "@/lib/resources/types"
import { cn } from "@/lib/utils"

type ResourcesManagerProps = {
  resources: ResourceWithRelations[]
  providers: ProviderOption[]
  categories: CategoryOption[]
  total: number
  page: number
  pageSize: number
  providerId: string | null
  onMutated?: () => void
}

function pageHref(page: number, providerId: string | null) {
  const params = new URLSearchParams()
  if (page > 1) params.set("page", String(page))
  if (providerId) params.set("provider", providerId)
  const qs = params.toString()
  return qs ? `?${qs}` : "?"
}

export function ResourcesManager({
  resources,
  providers,
  categories,
  total,
  page,
  pageSize,
  providerId,
  onMutated,
}: ResourcesManagerProps) {
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ResourceWithRelations | null>(
    null
  )
  const [deleting, setDeleting] = React.useState<ResourceWithRelations | null>(
    null
  )
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(resource: ResourceWithRelations) {
    setEditing(resource)
    setSheetOpen(true)
  }

  function onProviderFilter(value: string | null) {
    const next = value === "all" || !value ? null : value
    navigate(pageHref(1, next))
  }

  async function toggleActive(resource: ResourceWithRelations) {
    setBusyId(resource.id)
    const result = await setResourceActive(resource.id, !resource.is_active)
    if (!result.ok) {
      toast.error("Could not update status", { description: result.error })
    } else {
      toast.success(
        resource.is_active ? "Resource deactivated" : "Resource activated"
      )
      onMutated?.()
    }
    setBusyId(null)
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    const result = await deleteResource(deleting.id)
    if (!result.ok) {
      toast.error("Could not delete resource", { description: result.error })
    } else {
      toast.success("Resource deleted")
      setDeleting(null)
      onMutated?.()
    }
    setBusyId(null)
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <p className="text-muted-foreground text-sm">
              {total} resource{total === 1 ? "" : "s"}
            </p>
            <Select
              value={providerId ?? "all"}
              onValueChange={onProviderFilter}
              items={{
                all: "All providers",
                ...Object.fromEntries(
                  providers.map((provider) => [provider.id, provider.name])
                ),
              }}
            >
              <SelectTrigger className="bg-background h-8 w-52 max-w-full">
                <SelectValue placeholder="All providers" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" className="max-h-56">
                <SelectItem value="all">All providers</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus />
            Create resource
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Resource</TableHead>
              <TableHead className="hidden md:table-cell">Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden lg:table-cell">Categories</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-12 text-center"
                >
                  No resources yet. Create the first card for carousels and
                  feeds.
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource) => {
                const Icon = categoryIcon(resource.icon_key)
                const categoryLinks = [
                  ...(resource.category_resources ?? []),
                ].sort((a, b) => a.sort_order - b.sort_order)
                return (
                  <TableRow key={resource.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6">
                      <button
                        type="button"
                        onClick={() => openEdit(resource)}
                        className="flex items-start gap-3 text-left"
                      >
                        <span className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 space-y-0.5">
                          <span className="block font-medium">
                            {resource.title}
                          </span>
                          <span className="text-muted-foreground block text-xs">
                            {resource.summary ||
                              resource.carousel_label ||
                              "—"}
                          </span>
                          <span className="text-muted-foreground block text-xs md:hidden">
                            {resource.providers?.name ?? "—"}
                          </span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {resource.providers?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {RESOURCE_TYPE_LABELS[resource.type] ?? resource.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {categoryLinks.length === 0 ? (
                        <span className="text-muted-foreground text-xs">
                          None
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {categoryLinks.map((link) => (
                            <Badge
                              key={link.category_id}
                              variant="secondary"
                              className="font-normal"
                            >
                              {link.categories?.name ?? link.category_id}
                              <span className="text-muted-foreground ml-1 tabular-nums">
                                #{link.sort_order}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-medium",
                          resource.is_active
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {resource.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={busyId === resource.id}
                              aria-label={`Actions for ${resource.title}`}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(resource)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActive(resource)}
                          >
                            {resource.is_active ? <PowerOff /> : <Power />}
                            {resource.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleting(resource)}
                          >
                            <Trash2 />
                            Delete…
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
            {total}
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={
                    page > 1 ? pageHref(page - 1, providerId) : undefined
                  }
                  aria-disabled={page <= 1}
                  className={
                    page <= 1 ? "pointer-events-none opacity-50" : undefined
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href={pageHref(pageNum, providerId)}
                      isActive={pageNum === page}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href={
                    page < totalPages
                      ? pageHref(page + 1, providerId)
                      : undefined
                  }
                  aria-disabled={page >= totalPages}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}

      <ResourceFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        resource={editing}
        providers={providers}
        categories={categories}
        onSaved={onMutated}
      />

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.title}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the resource and its category links.
              Prefer deactivating to hide it instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={busyId === deleting?.id}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
