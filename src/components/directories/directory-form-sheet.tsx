"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  createDirectory,
  updateDirectory,
} from "@/app/dashboard/directories/actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { categoryIcon } from "@/lib/categories/icons"
import { DIRECTORY_ICON_KEYS } from "@/lib/directories/constants"
import type { Directory } from "@/lib/directories/types"
import { cn } from "@/lib/utils"

type DirectoryFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  directory: Directory | null
}

export function DirectoryFormSheet({
  open,
  onOpenChange,
  directory,
}: DirectoryFormSheetProps) {
  const isEdit = Boolean(directory)
  const [pending, setPending] = React.useState(false)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [externalUrl, setExternalUrl] = React.useState("")
  const [iconKey, setIconKey] = React.useState("folder")
  const [sortOrder, setSortOrder] = React.useState(0)
  const [showOnResources, setShowOnResources] = React.useState(true)
  const [isActive, setIsActive] = React.useState(true)

  React.useEffect(() => {
    if (!open) return
    setName(directory?.name ?? "")
    setDescription(directory?.description ?? "")
    setExternalUrl(directory?.external_url ?? "")
    setIconKey(directory?.icon_key ?? "folder")
    setSortOrder(directory?.sort_order ?? 0)
    setShowOnResources(directory?.show_on_resources ?? true)
    setIsActive(directory?.is_active ?? true)
  }, [open, directory])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    const formData = new FormData()
    formData.set("name", name)
    formData.set("description", description)
    formData.set("external_url", externalUrl)
    formData.set("icon_key", iconKey)
    formData.set("sort_order", String(sortOrder))
    formData.set("show_on_resources", showOnResources ? "true" : "false")
    formData.set("is_active", isActive ? "true" : "false")

    const result = isEdit
      ? await updateDirectory(directory!.id, formData)
      : await createDirectory(formData)

    if (!result.ok) {
      toast.error(
        isEdit ? "Could not update directory" : "Could not create directory",
        { description: result.error }
      )
      setPending(false)
      return
    }

    toast.success(isEdit ? "Directory updated" : "Directory created")
    setPending(false)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl data-[side=right]:sm:max-w-lg data-[side=right]:lg:max-w-xl data-[side=right]:xl:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Edit directory" : "Create directory"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          <div className="space-y-2">
            <Label htmlFor="directory-name">Name</Label>
            <Input
              id="directory-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Jersey ResourceNet"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="directory-description">Description</Label>
            <textarea
              id="directory-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A statewide directory of reentry and community services in New Jersey."
              rows={3}
              className={cn(
                "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 md:text-sm dark:bg-input/30"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="directory-url">External URL</Label>
            <Input
              id="directory-url"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://www.nj.gov"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="directory-sort">Sort order</Label>
            <Input
              id="directory-sort"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              className="h-9 w-28 tabular-nums"
            />
            <p className="text-muted-foreground text-xs">
              Lower numbers appear first in the Resources carousel.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {DIRECTORY_ICON_KEYS.map((key) => {
                const Icon = categoryIcon(key)
                const selected = iconKey === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIconKey(key)}
                    className={cn(
                      "border-border flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] transition-colors",
                      selected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "text-muted-foreground hover:bg-muted/60"
                    )}
                    aria-pressed={selected}
                    title={key}
                  >
                    <Icon className="size-4" />
                    <span className="max-w-full truncate">{key}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <Checkbox
              checked={showOnResources}
              onCheckedChange={(checked) => setShowOnResources(checked)}
            />
            <span className="text-sm">Show on Resources carousel</span>
          </label>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked)}
              className="after:hidden"
              aria-label="Active"
            />
            <span className="text-sm">Active</span>
          </div>

          <SheetFooter className="mt-auto px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create directory"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
