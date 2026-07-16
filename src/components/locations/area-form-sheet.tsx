import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  createArea,
  updateArea,
} from "@/lib/locations/actions"
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
import type { Area, StateOption } from "@/lib/locations/types"

type FieldErrors = {
  stateCode?: string
  name?: string
}

type AreaFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  area: Area | null
  stateOptions: StateOption[]
  defaultStateCode: string | null
}

export function AreaFormSheet({
  open,
  onOpenChange,
  onSaved,
  area,
  stateOptions,
  defaultStateCode: _defaultStateCode,
}: AreaFormSheetProps) {
  const isEdit = Boolean(area)
  const [pending, setPending] = React.useState(false)
  const [stateCode, setStateCode] = React.useState("")
  const [name, setName] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState(0)
  const [isActive, setIsActive] = React.useState(false)
  const [errors, setErrors] = React.useState<FieldErrors>({})

  React.useEffect(() => {
    if (!open) return
    // Edit keeps existing state; create starts empty (required select).
    setStateCode(area?.state_code ?? "")
    setName(area?.name ?? "")
    setSortOrder(area?.sort_order ?? 0)
    setIsActive(area?.is_active ?? false)
    setErrors({})
  }, [open, area])

  const stateItems = Object.fromEntries(
    stateOptions.map((s) => [s.code, `${s.name} (${s.code})`])
  )

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
    if (!stateCode) nextErrors.stateCode = "State is required"
    if (!name.trim()) nextErrors.name = "Name is required"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)

    const formData = new FormData()
    formData.set("state_code", stateCode)
    formData.set("name", name)
    formData.set("sort_order", String(sortOrder))
    formData.set("is_active", isActive ? "true" : "false")

    const result = isEdit
      ? await updateArea(area!.id, formData)
      : await createArea(formData)

    if (!result.ok) {
      toast.error(isEdit ? "Could not update area" : "Could not create area", {
        description: result.error,
      })
      setPending(false)
      return
    }

    toast.success(isEdit ? "Area updated" : "Area created")
    setPending(false)
    onSaved?.()
    onOpenChange(false)
  }

  const canSubmit =
    !pending && stateOptions.length > 0 && Boolean(stateCode)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit area" : "Create area"}</SheetTitle>
        </SheetHeader>

        <form
          noValidate
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          <div className="space-y-2">
            <Label>State</Label>
            <Select
              value={stateCode || null}
              onValueChange={(value) => {
                if (value) {
                  setStateCode(value)
                  clearError("stateCode")
                }
              }}
              disabled={isEdit}
              items={stateItems}
            >
              <SelectTrigger
                className="h-9 w-full"
                aria-invalid={Boolean(errors.stateCode) || undefined}
              >
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent
                side="bottom"
                align="start"
                alignItemWithTrigger={false}
                collisionAvoidance={{ side: "none", fallbackAxisSide: "none" }}
                className="max-h-56"
              >
                {stateOptions.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.name} ({option.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.stateCode} />
            {isEdit ? (
              <p className="text-muted-foreground text-xs">
                State cannot be changed after create. Delete and recreate to
                move an area.
              </p>
            ) : stateOptions.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No states found. Create a state before adding areas.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="area-name">Name</Label>
            <Input
              id="area-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                clearError("name")
              }}
              placeholder="Dallas County"
              aria-invalid={Boolean(errors.name) || undefined}
              className="h-9"
            />
            <FieldError message={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area-sort">Sort order</Label>
            <Input
              id="area-sort"
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
            <Button type="submit" disabled={!canSubmit}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create area"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
