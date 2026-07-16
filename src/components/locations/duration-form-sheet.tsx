"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  createCommunityDuration,
  updateCommunityDuration,
} from "@/app/dashboard/locations/actions"
import { FieldError } from "@/components/field-error"
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
import type { CommunityDuration } from "@/lib/locations/types"

type FieldErrors = {
  label?: string
}

type DurationFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  duration: CommunityDuration | null
}

export function DurationFormSheet({
  open,
  onOpenChange,
  duration,
}: DurationFormSheetProps) {
  const isEdit = Boolean(duration)
  const [pending, setPending] = React.useState(false)
  const [label, setLabel] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState(0)
  const [isActive, setIsActive] = React.useState(false)
  const [errors, setErrors] = React.useState<FieldErrors>({})

  React.useEffect(() => {
    if (!open) return
    setLabel(duration?.label ?? "")
    setSortOrder(duration?.sort_order ?? 0)
    setIsActive(duration?.is_active ?? false)
    setErrors({})
  }, [open, duration])

  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors = {}
    if (!label.trim()) nextErrors.label = "Label is required"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)

    const formData = new FormData()
    formData.set("label", label)
    formData.set("sort_order", String(sortOrder))
    formData.set("is_active", isActive ? "true" : "false")

    const result = isEdit
      ? await updateCommunityDuration(duration!.id, formData)
      : await createCommunityDuration(formData)

    if (!result.ok) {
      toast.error(
        isEdit ? "Could not update duration" : "Could not create duration",
        { description: result.error }
      )
      setPending(false)
      return
    }

    toast.success(isEdit ? "Duration updated" : "Duration created")
    setPending(false)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Edit community duration" : "Create community duration"}
          </SheetTitle>
        </SheetHeader>

        <form
          noValidate
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          <div className="space-y-2">
            <Label htmlFor="duration-label">Label</Label>
            <Input
              id="duration-label"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value)
                clearError("label")
              }}
              placeholder="Less than 6 months"
              aria-invalid={Boolean(errors.label) || undefined}
              className="h-9"
            />
            <FieldError message={errors.label} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration-sort">Sort order</Label>
            <Input
              id="duration-sort"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="h-9"
            />
          </div>

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
                "Create duration"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
