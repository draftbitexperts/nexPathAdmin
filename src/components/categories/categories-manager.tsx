"use client"

import * as React from "react"
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
  deleteCategory,
  setCategoryActive,
} from "@/app/dashboard/categories/actions"
import { CategoryFormSheet } from "@/components/categories/category-form-sheet"
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
import { SURFACE_LABELS } from "@/lib/categories/constants"
import { categoryIcon } from "@/lib/categories/icons"
import type { CategoryWithPlacements } from "@/lib/categories/types"
import { cn } from "@/lib/utils"

type CategoriesManagerProps = {
  categories: CategoryWithPlacements[]
  total: number
  page: number
  pageSize: number
}

export function CategoriesManager({
  categories,
  total,
  page,
  pageSize,
}: CategoriesManagerProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CategoryWithPlacements | null>(
    null
  )
  const [deleting, setDeleting] = React.useState<CategoryWithPlacements | null>(
    null
  )
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(category: CategoryWithPlacements) {
    setEditing(category)
    setSheetOpen(true)
  }

  async function toggleActive(category: CategoryWithPlacements) {
    setBusyId(category.id)
    const result = await setCategoryActive(category.id, !category.is_active)
    if (!result.ok) {
      toast.error("Could not update status", { description: result.error })
    } else {
      toast.success(
        category.is_active ? "Category deactivated" : "Category activated"
      )
    }
    setBusyId(null)
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    const result = await deleteCategory(deleting.id)
    if (!result.ok) {
      toast.error("Could not delete category", { description: result.error })
    } else {
      toast.success("Category deleted")
      setDeleting(null)
    }
    setBusyId(null)
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-3">
          <p className="text-muted-foreground text-sm">
            {total} categor{total === 1 ? "y" : "ies"}
          </p>
          <Button onClick={openCreate} size="sm">
            <Plus />
            Create category
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Category</TableHead>
              <TableHead className="hidden md:table-cell">Placements</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Icon</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-12 text-center"
                >
                  No categories yet. Create the first one to build the taxonomy.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => {
                const Icon = categoryIcon(category.icon_key)
                const placements = [...(category.category_placements ?? [])].sort(
                  (a, b) => a.sort_order - b.sort_order
                )
                return (
                  <TableRow key={category.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="flex items-start gap-3 text-left"
                      >
                        <span className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 space-y-0.5">
                          <span className="block font-medium">{category.name}</span>
                          <span className="text-muted-foreground block text-xs">
                            {category.short_description || "—"}
                          </span>
                          <span className="text-muted-foreground block font-mono text-[11px] md:hidden">
                            {category.slug}
                          </span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {placements.length === 0 ? (
                        <span className="text-muted-foreground text-xs">
                          None
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {placements.map((p) => (
                            <Badge
                              key={p.surface}
                              variant="secondary"
                              className="font-normal"
                            >
                              {SURFACE_LABELS[p.surface] ?? p.surface}
                              <span className="text-muted-foreground ml-1 tabular-nums">
                                #{p.sort_order}
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
                          category.is_active
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell">
                      {category.icon_key || "—"}
                    </TableCell>
                    <TableCell className="pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={busyId === category.id}
                              aria-label={`Actions for ${category.name}`}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(category)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActive(category)}
                          >
                            {category.is_active ? <PowerOff /> : <Power />}
                            {category.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleting(category)}
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
                  className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
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

      <CategoryFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        category={editing}
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
              This permanently removes the category and cascades to its
              placements, tasks, and links. Prefer deactivating to hide it
              instead.
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
