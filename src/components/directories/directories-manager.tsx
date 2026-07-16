import * as React from "react"
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteDirectory,
  setDirectoryActive,
} from "@/lib/directories/actions"
import { DirectoryFormSheet } from "@/components/directories/directory-form-sheet"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { categoryIcon } from "@/lib/categories/icons"
import type { Directory } from "@/lib/directories/types"
import { cn } from "@/lib/utils"

type DirectoriesManagerProps = {
  directories: Directory[]
  total: number
  page: number
  pageSize: number
  onMutated?: () => void
}

export function DirectoriesManager({
  directories,
  total,
  page,
  pageSize,
  onMutated,
}: DirectoriesManagerProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Directory | null>(null)
  const [deleting, setDeleting] = React.useState<Directory | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(directory: Directory) {
    setEditing(directory)
    setSheetOpen(true)
  }

  async function toggleActive(directory: Directory) {
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

  async function confirmDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    const result = await deleteDirectory(deleting.id)
    if (!result.ok) {
      toast.error("Could not delete directory", { description: result.error })
    } else {
      toast.success("Directory deleted")
      setDeleting(null)
      onMutated?.()
    }
    setBusyId(null)
  }

  return (
    <>
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
              <TableHead className="hidden md:table-cell">URL</TableHead>
              <TableHead className="hidden sm:table-cell">Order</TableHead>
              <TableHead>Carousel</TableHead>
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
                  No directories yet. Add regional starting points for the
                  Resources carousel.
                </TableCell>
              </TableRow>
            ) : (
              directories.map((directory) => {
                const Icon = categoryIcon(directory.icon_key)
                return (
                  <TableRow key={directory.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6">
                      <button
                        type="button"
                        onClick={() => openEdit(directory)}
                        className="flex items-start gap-3 text-left"
                      >
                        <span className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 space-y-0.5">
                          <span className="block font-medium">
                            {directory.name}
                          </span>
                          <span className="text-muted-foreground line-clamp-2 block text-xs">
                            {directory.description || "—"}
                          </span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {directory.external_url ? (
                        <a
                          href={directory.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground inline-flex max-w-[14rem] items-center gap-1 truncate text-xs"
                        >
                          <ExternalLink className="size-3 shrink-0" />
                          <span className="truncate">
                            {directory.external_url.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden tabular-nums sm:table-cell">
                      {directory.sort_order}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-medium",
                          directory.show_on_resources
                            ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {directory.show_on_resources ? "Shown" : "Hidden"}
                      </Badge>
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleting(directory)}
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
                  href={page > 1 ? `?page=${page - 1}` : undefined}
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
                      href={`?page=${pageNum}`}
                      isActive={pageNum === page}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href={page < totalPages ? `?page=${page + 1}` : undefined}
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
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the directory from the Resources
              carousel. Prefer deactivating to hide it instead.
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
