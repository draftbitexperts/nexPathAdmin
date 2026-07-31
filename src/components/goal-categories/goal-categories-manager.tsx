import * as React from "react"
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { GoalCategoryFormSheet } from "@/components/goal-categories/goal-category-form-sheet"
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
import {
  deleteGoalCategory,
  setGoalCategoryActive,
} from "@/lib/goal-categories/actions"
import type { GoalCategory } from "@/lib/goal-categories/types"
import { cn } from "@/lib/utils"

type GoalCategoriesManagerProps = {
  goalCategories: GoalCategory[]
  total: number
  page: number
  pageSize: number
  onMutated?: () => void
}

function pageHref(page: number) {
  return page > 1 ? `?page=${page}` : "?"
}

export function GoalCategoriesManager({
  goalCategories,
  total,
  page,
  pageSize,
  onMutated,
}: GoalCategoriesManagerProps) {
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<GoalCategory | null>(null)
  const [deleting, setDeleting] = React.useState<GoalCategory | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(goalCategory: GoalCategory) {
    setEditing(goalCategory)
    setSheetOpen(true)
  }

  async function toggleActive(goalCategory: GoalCategory) {
    setBusyId(goalCategory.id)
    const result = await setGoalCategoryActive(
      goalCategory.id,
      !goalCategory.is_active,
    )
    if (!result.ok) {
      toast.error("Could not update status", { description: result.error })
    } else {
      toast.success(
        goalCategory.is_active
          ? "Goal category deactivated"
          : "Goal category activated",
      )
      onMutated?.()
    }
    setBusyId(null)
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    const result = await deleteGoalCategory(deleting.id)
    if (!result.ok) {
      toast.error("Could not delete goal category", {
        description: result.error,
      })
    } else {
      toast.success("Goal category deleted")
      setDeleting(null)
      onMutated?.()
    }
    setBusyId(null)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-3">
          <p className="text-muted-foreground text-sm">
            {total} goal categor{total === 1 ? "y" : "ies"}
          </p>
          <Button onClick={openCreate} size="sm">
            <Plus />
            Create goal category
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Goal category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Tasks</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead className="hidden lg:table-cell">Icon</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {goalCategories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-12 text-center"
                >
                  No goal categories yet. Create one to define onboarding
                  priorities and path tasks.
                </TableCell>
              </TableRow>
            ) : (
              goalCategories.map((goalCategory) => {
                const Icon = categoryIcon(goalCategory.icon_key)
                const taskCount = goalCategory.task_count ?? 0
                const openDetails = () =>
                  navigate(`/dashboard/goal-categories/${goalCategory.id}`)

                return (
                  <TableRow
                    key={goalCategory.id}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={openDetails}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openDetails()
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${goalCategory.title}`}
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-start gap-3 text-left">
                        <span className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 space-y-0.5">
                          <span className="block font-medium">
                            {goalCategory.title}
                          </span>
                          <span className="text-muted-foreground block text-xs">
                            {goalCategory.subtitle || "—"}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-medium",
                          goalCategory.is_active
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {goalCategory.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden tabular-nums sm:table-cell">
                      {taskCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                      {goalCategory.slug}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell">
                      {goalCategory.icon_key || "—"}
                    </TableCell>
                    <TableCell
                      className="pr-4"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={busyId === goalCategory.id}
                              aria-label={`Actions for ${goalCategory.title}`}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEdit(goalCategory)}
                          >
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActive(goalCategory)}
                          >
                            {goalCategory.is_active ? <PowerOff /> : <Power />}
                            {goalCategory.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleting(goalCategory)}
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
                  href={page > 1 ? pageHref(page - 1) : undefined}
                  aria-disabled={page <= 1}
                  className={
                    page <= 1 ? "pointer-events-none opacity-50" : undefined
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href={pageHref(pageNumber)}
                      isActive={pageNumber === page}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href={page < totalPages ? pageHref(page + 1) : undefined}
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

      <GoalCategoryFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        goalCategory={editing}
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
              This permanently removes the goal category and cascades to its
              path tasks and resource links. Prefer deactivating to hide it
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
    </div>
  )
}
