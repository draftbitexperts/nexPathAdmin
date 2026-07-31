import * as React from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { FieldError } from "@/components/field-error"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  createPathTask,
  syncPathTaskResources,
  updatePathTask,
} from "@/lib/path-tasks/actions"
import { listPathTaskResourceIds } from "@/lib/path-tasks/queries"
import type { PathTask } from "@/lib/path-tasks/types"
import { createResource } from "@/lib/resources/actions"
import {
  RESOURCE_TYPE_LABELS,
} from "@/lib/resources/constants"
import {
  RESOURCE_TYPES,
  type ProviderOption,
  type ResourceType,
} from "@/lib/resources/types"
import { cn } from "@/lib/utils"

type FieldErrors = {
  title?: string
  description?: string
  sortOrder?: string
}

type CreatedResource = {
  id: string
  title: string
}

type PathTaskFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  goalCategoryId: string
  task: PathTask | null
  providers: ProviderOption[]
  nextSortOrder: number
  initialStep?: 1 | 2
  modal?: boolean
}

export function PathTaskFormSheet({
  open,
  onOpenChange,
  onSaved,
  goalCategoryId,
  task,
  providers,
  nextSortOrder,
  initialStep = 1,
  modal = false,
}: PathTaskFormSheetProps) {
  const isEdit = Boolean(task)
  const isResourceOnly = Boolean(task && initialStep === 2)
  const [pending, setPending] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [subtitle, setSubtitle] = React.useState("")
  const [completionLabel, setCompletionLabel] = React.useState("")
  const [uncompletionLabel, setUncompletionLabel] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState("0")
  const [isActive, setIsActive] = React.useState(true)
  const [linkedResourceIds, setLinkedResourceIds] = React.useState<string[]>([])
  const [creatingResource, setCreatingResource] = React.useState(false)
  const [resourceProviderId, setResourceProviderId] = React.useState("")
  const [resourceTitle, setResourceTitle] = React.useState("")
  const [resourceDescription, setResourceDescription] = React.useState("")
  const [resourceType, setResourceType] = React.useState<ResourceType>("text")
  const [resourceWebsiteUrl, setResourceWebsiteUrl] = React.useState("")
  const [resourcePhone, setResourcePhone] = React.useState("")
  const [resourceVideoUrl, setResourceVideoUrl] = React.useState("")
  const [savedTaskId, setSavedTaskId] = React.useState<string | null>(null)
  const [step, setStep] = React.useState<1 | 2>(1)
  const [createdResources, setCreatedResources] = React.useState<
    CreatedResource[]
  >([])
  const [isAddingResource, setIsAddingResource] = React.useState(true)
  const [errors, setErrors] = React.useState<FieldErrors>({})

  React.useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? "")
    setDescription(task?.description ?? "")
    setSubtitle(task?.subtitle ?? "")
    setCompletionLabel(task?.completion_label ?? "")
    setUncompletionLabel(task?.uncompletion_label ?? "")
    setSortOrder(String(task?.sort_order ?? nextSortOrder))
    setIsActive(task?.is_active ?? true)
    setLinkedResourceIds([])
    setCreatingResource(false)
    setResourceProviderId("")
    setResourceTitle("")
    setResourceDescription("")
    setResourceType("text")
    setResourceWebsiteUrl("")
    setResourcePhone("")
    setResourceVideoUrl("")
    setSavedTaskId(task?.id ?? null)
    setStep(task && initialStep === 2 ? 2 : 1)
    setCreatedResources([])
    setIsAddingResource(true)
    setErrors({})
  }, [open, task])

  React.useEffect(() => {
    if (!open || !task) return
    let cancelled = false
    void listPathTaskResourceIds(task.id)
      .then((ids) => {
        if (!cancelled) {
          setLinkedResourceIds(ids)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error("Could not load linked resources", {
            description:
              error instanceof Error ? error.message : "Please try again.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, task])

  function clearError(field: keyof FieldErrors) {
    setErrors((previous) => {
      if (!previous[field]) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  async function createAndLinkResource() {
    if (!savedTaskId) return
    const missingRequiredField =
      !resourceProviderId ||
      !resourceTitle.trim() ||
      !resourceDescription.trim() ||
      (resourceType === "website" && !resourceWebsiteUrl.trim()) ||
      (resourceType === "hotline" && !resourcePhone.trim()) ||
      (resourceType === "video" && !resourceVideoUrl.trim())
    if (missingRequiredField) {
      toast.error("Complete all required resource fields")
      return
    }
    setCreatingResource(true)

    const formData = new FormData()
    formData.set("provider_id", resourceProviderId)
    formData.set("title", resourceTitle)
    formData.set("description", resourceDescription)
    formData.set("type", resourceType ?? "")
    formData.set("website_url", resourceWebsiteUrl)
    formData.set("phone", resourcePhone)
    formData.set("video_url", resourceVideoUrl)
    formData.set("thumbnail_url", "")
    formData.set("has_video_upload", "false")
    formData.set("has_thumbnail", "true")
    formData.set("is_active", "true")

    const result = await createResource(formData)
    if (!result.ok || !result.id) {
      toast.error("Could not create resource", {
        description: result.ok ? "The new resource did not return an id." : result.error,
      })
      setCreatingResource(false)
      return
    }

    const nextIds = [...linkedResourceIds, result.id]
    const linkResult = await syncPathTaskResources(savedTaskId, nextIds)
    if (!linkResult.ok) {
      toast.error("Resource created, but it could not be linked to this task", {
        description: linkResult.error,
      })
      setCreatingResource(false)
      return
    }

    setLinkedResourceIds(nextIds)
    setResourceProviderId("")
    setResourceTitle("")
    setResourceDescription("")
    setResourceType("text")
    setResourceWebsiteUrl("")
    setResourcePhone("")
    setResourceVideoUrl("")
    setCreatedResources((current) => [
      ...current,
      { id: result.id!, title: resourceTitle.trim() },
    ])
    setIsAddingResource(false)
    toast.success("Resource created and linked")
    setCreatingResource(false)
  }

  function validateTask() {
    const nextErrors: FieldErrors = {}
    if (!title.trim()) nextErrors.title = "Title is required"
    if (!description.trim()) nextErrors.description = "Description is required"
    if (!/^\d+$/.test(sortOrder)) {
      nextErrors.sortOrder = "Enter a non-negative whole number"
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function taskFormData() {
    const formData = new FormData()
    formData.set("title", title)
    formData.set("description", description)
    formData.set("subtitle", subtitle)
    formData.set("completion_label", completionLabel)
    formData.set("uncompletion_label", uncompletionLabel)
    formData.set("sort_order", sortOrder)
    formData.set("is_active", isActive ? "true" : "false")
    return formData
  }

  async function saveTask(): Promise<string | null> {
    const result = isEdit
      ? await updatePathTask(task!.id, taskFormData())
      : await createPathTask(goalCategoryId, taskFormData())
    if (!result.ok) {
      toast.error(isEdit ? "Could not update task" : "Could not create task", {
        description: result.error,
      })
      return null
    }
    return task?.id ?? result.id ?? null
  }

  async function continueToResources() {
    if (!validateTask()) return
    setPending(true)
    const taskId = await saveTask()
    setPending(false)
    if (!taskId) return

    setSavedTaskId(taskId)
    setStep(2)
  }

  async function saveWithoutResources() {
    if (!validateTask()) return
    setPending(true)
    const taskId = await saveTask()
    setPending(false)
    if (!taskId) return
    toast.success(isEdit ? "Task updated" : "Task created")
    onSaved?.()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={
          modal
            ? "top-1/2! left-1/2! right-auto! h-[min(85vh,42rem)]! w-[calc(100%-2rem)]! max-w-lg! -translate-x-1/2! -translate-y-1/2! rounded-xl border ring-1 ring-foreground/10 data-[side=right]:data-ending-style:translate-x-0 data-[side=right]:data-starting-style:translate-x-0"
            : "w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl data-[side=right]:sm:max-w-lg data-[side=right]:lg:max-w-xl data-[side=right]:xl:max-w-2xl"
        }
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 pr-10">
          <div className="flex items-center gap-2">
            {step === 2 && !isResourceOnly ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setStep(1)}
                disabled={pending || creatingResource}
                aria-label="Back to task details"
              >
                <ArrowLeft />
              </Button>
            ) : null}
            <SheetTitle>
              {isResourceOnly
                ? "Add resource"
                : isEdit
                  ? "Edit path task"
                  : "Create path task"}
            </SheetTitle>
          </div>
          {!isResourceOnly ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground hidden text-xs sm:inline">
              {step === 1 ? "Task details" : "Add resources"}
            </span>
            <div className="bg-muted h-1.5 w-14 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full bg-primary transition-all duration-300 ${
                  step === 1 ? "w-1/2" : "w-full"
                }`}
              />
            </div>
            <span className="text-muted-foreground text-xs">Step {step}/2</span>
          </div>
          ) : null}
        </SheetHeader>
        <form
          noValidate
          onSubmit={(event) => event.preventDefault()}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          {step === 1 ? (
            <>
          <div className="space-y-2">
            <Label htmlFor="path-task-title">Title</Label>
            <Input
              id="path-task-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                clearError("title")
              }}
              placeholder="Get a state-issued ID"
              aria-invalid={Boolean(errors.title) || undefined}
            />
            <FieldError message={errors.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="path-task-description">Why it&apos;s important</Label>
            <textarea
              id="path-task-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                clearError("description")
              }}
              rows={4}
              aria-invalid={Boolean(errors.description) || undefined}
              className={cn(
                "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30",
              )}
            />
            <FieldError message={errors.description} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="path-task-subtitle">Subtitle</Label>
            <Input
              id="path-task-subtitle"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              placeholder="Optional italic line under the title"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="path-task-completion-label">Complete label</Label>
              <Input
                id="path-task-completion-label"
                value={completionLabel}
                onChange={(event) => setCompletionLabel(event.target.value)}
                placeholder="Mark complete"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="path-task-uncompletion-label">
                Incomplete label
              </Label>
              <Input
                id="path-task-uncompletion-label"
                value={uncompletionLabel}
                onChange={(event) => setUncompletionLabel(event.target.value)}
                placeholder="Mark incomplete"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="path-task-sort-order">Sort order</Label>
            <Input
              id="path-task-sort-order"
              inputMode="numeric"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value.replace(/\D/g, ""))
                clearError("sortOrder")
              }}
              aria-invalid={Boolean(errors.sortOrder) || undefined}
            />
            <FieldError message={errors.sortOrder} />
          </div>
            </>
          ) : null}

          {step === 2 ? (
          <section className="space-y-4">
            {savedTaskId ? (
              <>
              {isAddingResource ? (
                <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={resourceProviderId || null}
                      onValueChange={(value) => value && setResourceProviderId(value)}
                      items={Object.fromEntries(
                        providers.map((provider) => [provider.id, provider.name]),
                      )}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={resourceType}
                      onValueChange={(value) =>
                        value && setResourceType(value as ResourceType)
                      }
                      items={RESOURCE_TYPE_LABELS}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOURCE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {RESOURCE_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="path-task-resource-title">Resource name</Label>
                  <Input
                    id="path-task-resource-title"
                    value={resourceTitle}
                    onChange={(event) => setResourceTitle(event.target.value)}
                    placeholder="DMV appointment"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="path-task-resource-description">Description</Label>
                  <textarea
                    id="path-task-resource-description"
                    value={resourceDescription}
                    onChange={(event) => setResourceDescription(event.target.value)}
                    rows={3}
                    required
                    className={cn(
                      "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30",
                    )}
                  />
                </div>

                {resourceType === "website" ? (
                  <div className="space-y-2">
                    <Label htmlFor="path-task-resource-website">Website URL</Label>
                    <Input
                      id="path-task-resource-website"
                      type="url"
                      value={resourceWebsiteUrl}
                      onChange={(event) => setResourceWebsiteUrl(event.target.value)}
                      placeholder="https://…"
                      required
                    />
                  </div>
                ) : null}

                {resourceType === "hotline" ? (
                  <div className="space-y-2">
                    <Label htmlFor="path-task-resource-phone">Phone</Label>
                    <Input
                      id="path-task-resource-phone"
                      inputMode="numeric"
                      value={resourcePhone}
                      onChange={(event) =>
                        setResourcePhone(event.target.value.replace(/\D/g, ""))
                      }
                      required
                    />
                  </div>
                ) : null}

                {resourceType === "video" ? (
                  <div className="space-y-2">
                    <Label htmlFor="path-task-resource-video">Video URL</Label>
                    <Input
                      id="path-task-resource-video"
                      type="url"
                      value={resourceVideoUrl}
                      onChange={(event) => setResourceVideoUrl(event.target.value)}
                      placeholder="https://…"
                      required
                    />
                    <p className="text-muted-foreground text-xs">
                      Paste a public video URL.
                    </p>
                  </div>
                ) : null}

                <Button
                  type="button"
                  size="sm"
                  onClick={createAndLinkResource}
                  disabled={creatingResource}
                >
                  {creatingResource ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create and add resource"
                  )}
                </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingResource(true)}
                >
                  Add another resource
                </Button>
              )}
              {createdResources.length > 0 ? (
                <div className="mt-5 space-y-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Added resources
                  </p>
                  <ul className="space-y-1.5">
                    {createdResources.map((resource) => (
                      <li
                        key={resource.id}
                        className="flex items-center justify-between gap-3 rounded-md bg-background/70 px-3 py-2 text-sm shadow-sm"
                      >
                        <span className="min-w-0 truncate font-medium">
                          {resource.title}
                        </span>
                        <span className="shrink-0 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Added
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              </>
            ) : null}
          </section>
          ) : null}

          {step === 1 ? (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked)}
              className="after:hidden"
              aria-label="Active"
            />
            <span className="text-sm">Active</span>
          </div>
          ) : null}

          <SheetFooter className="mt-auto px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            {step === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveWithoutResources}
                  disabled={pending}
                >
                  {pending ? "Saving…" : isEdit ? "Save changes" : "Save task"}
                </Button>
                <Button
                  type="button"
                  onClick={continueToResources}
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Continue to resources"
                  )}
                </Button>
              </>
            ) : null}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
