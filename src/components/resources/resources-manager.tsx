import * as React from "react"
import { useNavigate } from "react-router"
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Trash2,
  X,
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
import { Input } from "@/components/ui/input"
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
  search: string | null
  onMutated?: () => void
}

function pageHref(
  page: number,
  providerId: string | null,
  search: string | null
) {
  const params = new URLSearchParams()
  if (page > 1) params.set("page", String(page))
  if (providerId) params.set("provider", providerId)
  const q = search?.trim()
  if (q) params.set("q", q)
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
  search,
  onMutated,
}: ResourcesManagerProps) {
  const navigate = useNavigate()
  const [query, setQuery] = React.useState(search ?? "")
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ResourceWithRelations | null>(
    null
  )
  const [deleting, setDeleting] = React.useState<ResourceWithRelations | null>(
    null
  )
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  React.useEffect(() => {
    setQuery(search ?? "")
  }, [search])

  React.useEffect(() => {
    const trimmed = query.trim()
    const current = (search ?? "").trim()
    if (trimmed === current) return

    const timer = window.setTimeout(() => {
      navigate(pageHref(1, providerId, trimmed || null))
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, navigate, search, providerId])

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
    navigate(pageHref(1, next, search))
  }

  function clearSearch() {
    setQuery("")
    navigate(pageHref(1, providerId, null))
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources…"
            className="h-8 pr-8 pl-8"
            aria-label="Search resources"
          />
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

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
              <TableHead className="w-20">Image</TableHead>
              <TableHead className="hidden md:table-cell">Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
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
                  colSpan={7}
                  className="text-muted-foreground py-12 text-center"
                >
                  {search
                    ? `No resources match “${search}”.`
                    : "No resources yet. Create the first card for carousels and feeds."}
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource) => {
                const categoryLinks = resource.category_resources ?? []
                return (
                  <TableRow key={resource.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6">
                      <button
                        type="button"
                        onClick={() => openEdit(resource)}
                        className="text-left"
                      >
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
                      </button>
                    </TableCell>
                    <TableCell>
                      {resource.image_url ? (
                        <img
                          src={resource.image_url}
                          alt=""
                          className="size-16 rounded object-cover"
                        />
                      ) : (
                        <span className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded text-[10px]">
                          No image
                        </span>
                      )}
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
                    page > 1
                      ? pageHref(page - 1, providerId, search)
                      : undefined
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
                      href={pageHref(pageNum, providerId, search)}
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
                      ? pageHref(page + 1, providerId, search)
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
              This permanently removes the resource, its category links, and
              any thumbnail in storage. Prefer deactivating to hide it instead.
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
    </div>
  )
}
