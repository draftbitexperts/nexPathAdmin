import * as React from "react"
import { useNavigate } from "react-router"
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { setDirectoryActive } from "@/lib/directories/actions"
import { DirectoryFormSheet } from "@/components/directories/directory-form-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DirectoryWithRelations } from "@/lib/directories/types"
import type { StateOption } from "@/lib/locations/types"
import { cn } from "@/lib/utils"

type DirectoriesManagerProps = {
  directories: DirectoryWithRelations[]
  total: number
  page: number
  pageSize: number
  search: string | null
  stateOptions: StateOption[]
  onMutated?: () => void
}

function pageHref(page: number, search: string | null) {
  const params = new URLSearchParams()
  if (page > 1) params.set("page", String(page))
  const q = search?.trim()
  if (q) params.set("q", q)
  const qs = params.toString()
  return qs ? `?${qs}` : "?"
}

export function DirectoriesManager({
  directories,
  total,
  page,
  pageSize,
  search,
  stateOptions,
  onMutated,
}: DirectoriesManagerProps) {
  const navigate = useNavigate()
  const [query, setQuery] = React.useState(search ?? "")
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<DirectoryWithRelations | null>(
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
      navigate(pageHref(1, trimmed || null))
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, navigate, search])

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(directory: DirectoryWithRelations) {
    setEditing(directory)
    setSheetOpen(true)
  }

  function clearSearch() {
    setQuery("")
    navigate(pageHref(1, null))
  }

  async function toggleActive(directory: DirectoryWithRelations) {
    setBusyId(directory.id)
    const result = await setDirectoryActive(directory.id, !directory.is_active)
    if (!result.ok) {
      toast.error("Could not update status", { description: result.error })
    } else {
      toast.success(
        directory.is_active ? "Directory deactivated" : "Directory activated"
      )
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
            placeholder="Search directories…"
            className="h-8 pr-8 pl-8"
            aria-label="Search directories"
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
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-3">
          <p className="text-muted-foreground text-sm">
            {total} director{total === 1 ? "y" : "ies"}
          </p>
          <Button onClick={openCreate} size="sm">
            <Plus />
            Create directory
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Directory</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden lg:table-cell">URL</TableHead>
              <TableHead className="hidden sm:table-cell">
                Juvenile justice
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {directories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-12 text-center"
                >
                  {search
                    ? `No directories match “${search}”.`
                    : "No directories yet. Add location-scoped starting points for the Resources tab."}
                </TableCell>
              </TableRow>
            ) : (
              directories.map((directory) => {
                const stateLabel =
                  directory.states?.name ?? directory.state_code
                const areaLabel = directory.area_id
                  ? (directory.areas?.name ?? "Area")
                  : "Statewide"

                return (
                  <TableRow key={directory.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6">
                      <button
                        type="button"
                        onClick={() => openEdit(directory)}
                        className="min-w-0 space-y-0.5 text-left"
                      >
                        <span className="block font-medium">
                          {directory.name}
                        </span>
                        <span className="text-muted-foreground line-clamp-2 block text-xs">
                          {directory.description || "—"}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="block text-sm">{stateLabel}</span>
                      <span className="text-muted-foreground text-xs">
                        {areaLabel}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <a
                        href={directory.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground inline-flex max-w-56 items-center gap-1 truncate text-xs"
                      >
                        <ExternalLink className="size-3 shrink-0" />
                        <span className="truncate">
                          {directory.external_url.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {directory.is_juvenile_justice_centered ? (
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/10 font-medium text-amber-700 dark:text-amber-400"
                        >
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-medium",
                          directory.is_active
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {directory.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={busyId === directory.id}
                              aria-label={`Actions for ${directory.name}`}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(directory)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActive(directory)}
                          >
                            {directory.is_active ? <PowerOff /> : <Power />}
                            {directory.is_active ? "Deactivate" : "Activate"}
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
                  href={page > 1 ? pageHref(page - 1, search) : undefined}
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
                      href={pageHref(pageNum, search)}
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
                    page < totalPages ? pageHref(page + 1, search) : undefined
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

      <DirectoryFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        directory={editing}
        stateOptions={stateOptions}
        onSaved={onMutated}
      />
    </div>
  )
}
