import * as React from "react"
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PathTaskFormSheet } from "@/components/path-tasks/path-task-form-sheet"
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
import { RESOURCE_TYPE_LABELS } from "@/lib/resources/constants"
import { deletePathTask } from "@/lib/path-tasks/actions"
import { deleteResource } from "@/lib/resources/actions"
import type { PathTask } from "@/lib/path-tasks/types"
import type {
  CategoryOption,
  ProviderOption,
  ResourceWithRelations,
} from "@/lib/resources/types"

type PathTasksManagerProps = {
  goalCategoryId: string
  tasks: PathTask[]
  providers: ProviderOption[]
  categories: CategoryOption[]
  total: number
  page: number
  pageSize: number
  onMutated?: () => void
}

function pageHref(page: number) {
  return page > 1 ? `?page=${page}` : "?"
}

export function PathTasksManager({
  goalCategoryId,
  tasks,
  providers,
  categories,
  total,
  page,
  pageSize,
  onMutated,
}: PathTasksManagerProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PathTask | null>(null)
  const [startOnResources, setStartOnResources] = React.useState(false)
  const [deleting, setDeleting] = React.useState<PathTask | null>(null)
  const [resourceSheetOpen, setResourceSheetOpen] = React.useState(false)
  const [editingResource, setEditingResource] =
    React.useState<ResourceWithRelations | null>(null)
  const [deletingResource, setDeletingResource] =
    React.useState<ResourceWithRelations | null>(null)
  const [busy, setBusy] = React.useState(false)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function openCreate() {
    setEditing(null)
    setStartOnResources(false)
    setSheetOpen(true)
  }

  function openEdit(task: PathTask) {
    setEditing(task)
    setStartOnResources(false)
    setSheetOpen(true)
  }

  function openAddResource(task: PathTask) {
    setEditing(task)
    setStartOnResources(true)
    setSheetOpen(true)
  }

  function openEditResource(resource: ResourceWithRelations) {
    setEditingResource(resource)
    setResourceSheetOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    const result = await deletePathTask(deleting.id)
    if (!result.ok) {
      toast.error("Could not delete task", { description: result.error })
    } else {
      toast.success("Task deleted")
      setDeleting(null)
      onMutated?.()
    }
    setBusy(false)
  }

  async function confirmResourceDelete() {
    if (!deletingResource) return
    setBusy(true)
    const result = await deleteResource(deletingResource.id)
    if (!result.ok) {
      toast.error("Could not delete resource", { description: result.error })
    } else {
      toast.success("Resource deleted")
      setDeletingResource(null)
      onMutated?.()
    }
    setBusy(false)
  }

  return (
    <div className="space-y-5">
      <section className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-medium">Path tasks</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {total === 0
                ? "Create a clear next action to get started."
                : `${total} action item${total === 1 ? "" : "s"} in this path.`}
            </p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus />
            Create task
          </Button>
        </div>
        {tasks.length === 0 ? (
          <div className="text-muted-foreground flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 px-4 py-14 text-center">
            <span>No tasks yet. Create an action item for this goal category.</span>
            <Button size="sm" onClick={openCreate}>
              <Plus />
              Create first task
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => {
              const resourceLinks = [...(task.path_task_resources ?? [])].sort(
                (a, b) => a.sort_order - b.sort_order,
              )
              return (
                <article
                  key={task.id}
                  className="flex min-w-0 flex-col rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(task)}
                      className="min-w-0 text-left"
                    >
                      <h2 className="text-base font-semibold">{task.title}</h2>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${task.title}`}
                              />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(task)}>
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleting(task)}
                            >
                              <Trash2 />
                              Delete…
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
                  {task.description ? (
                    <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-6">
                      {task.description}
                    </p>
                  ) : null}
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground text-sm font-medium">
                        Resources
                      </span>
                      <Button
                        size="icon-sm"
                        className="shadow-sm"
                        onClick={() => openAddResource(task)}
                        aria-label={`Add resource to ${task.title}`}
                      >
                        <Plus />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {resourceLinks.length > 0 ? (
                        resourceLinks.map((link) => (
                          (() => {
                            const resource = link.resources
                            return (
                              <div
                                key={link.resource_id}
                                className="bg-muted/50 min-w-0 rounded-md px-2 py-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0 text-left">
                                    <span className="block truncate text-sm font-medium">
                                      {resource?.title ?? "Untitled resource"}
                                    </span>
                                    {resource ? (
                                      <span className="text-muted-foreground mt-0.5 block text-sm">
                                        {resource.providers?.name ?? "No provider"} ·{" "}
                                        {RESOURCE_TYPE_LABELS[resource.type]}
                                      </span>
                                    ) : null}
                                  </div>
                                  {resource ? (
                                    <div className="-my-1 -mr-1 flex shrink-0 items-center">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                          aria-label={`Edit ${resource.title}`}
                                          onClick={() => openEditResource(resource)}
                                >
                                  <Pencil />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-destructive hover:text-destructive"
                                          aria-label={`Delete ${resource.title}`}
                                          onClick={() => setDeletingResource(resource)}
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })()
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          No resources added yet
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {totalPages > 1 ? (
        <div className="flex justify-end">
          <Pagination className="mx-0 w-auto">
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

      <PathTaskFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        goalCategoryId={goalCategoryId}
        task={editing}
        providers={providers}
        nextSortOrder={total}
        initialStep={startOnResources ? 2 : 1}
        modal={startOnResources}
        onSaved={onMutated}
      />

      <ResourceFormSheet
        open={resourceSheetOpen}
        onOpenChange={setResourceSheetOpen}
        resource={editingResource}
        providers={providers}
        categories={categories}
        modal
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
              This permanently removes this task and its linked resources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={busy}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingResource)}
        onOpenChange={(open) => {
          if (!open) setDeletingResource(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deletingResource?.title}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the resource from this task and everywhere
              else it is used.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingResource(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmResourceDelete}
              disabled={busy}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
