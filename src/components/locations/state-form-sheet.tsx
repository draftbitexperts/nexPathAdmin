import * as React from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  createState,
  fetchAreasForState,
  syncStateAreas,
  updateState,
} from "@/lib/locations/actions"
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
import { normalizeStateCode } from "@/lib/locations/constants"
import type { State } from "@/lib/locations/types"

type AreaDraft = {
  key: string
  id?: string
  name: string
  sort_order: number
  is_active: boolean
}

type FieldErrors = {
  code?: string
  name?: string
  areas?: Record<string, string>
}

let draftKey = 0
function nextDraftKey() {
  draftKey += 1
  return `new-${draftKey}`
}

type StateFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  state: State | null
}

export function StateFormSheet({
  open,
  onOpenChange,
  onSaved,
  state,
}: StateFormSheetProps) {
  const isEdit = Boolean(state)
  const [pending, setPending] = React.useState(false)
  const [loadingAreas, setLoadingAreas] = React.useState(false)
  const [areasReady, setAreasReady] = React.useState(!state)
  const [code, setCode] = React.useState("")
  const [name, setName] = React.useState("")
  const [hasLocalAreas, setHasLocalAreas] = React.useState(false)
  const [sortOrder, setSortOrder] = React.useState(0)
  const [isActive, setIsActive] = React.useState(false)
  const [areas, setAreas] = React.useState<AreaDraft[]>([])
  const [errors, setErrors] = React.useState<FieldErrors>({})

  React.useEffect(() => {
    if (!open) return

    setCode(state?.code ?? "")
    setName(state?.name ?? "")
    setHasLocalAreas(state?.has_local_areas ?? false)
    setSortOrder(state?.sort_order ?? 0)
    setIsActive(state?.is_active ?? false)
    setAreas([])
    setErrors({})

    if (!state?.code) {
      setAreasReady(true)
      setLoadingAreas(false)
      return
    }

    let cancelled = false
    setAreasReady(false)
    setLoadingAreas(true)

    void fetchAreasForState(state.code).then((result) => {
      if (cancelled) return
      setLoadingAreas(false)
      if (!result.ok) {
        setAreasReady(false)
        toast.error("Could not load areas", { description: result.error })
        return
      }
      setAreas(
        result.areas.map((area) => ({
          key: area.id,
          id: area.id,
          name: area.name,
          sort_order: area.sort_order,
          is_active: area.is_active,
        }))
      )
      setAreasReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [open, state])

  function clearError(field: "code" | "name") {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function clearAreaError(key: string) {
    setErrors((prev) => {
      if (!prev.areas?.[key]) return prev
      const areasErrors = { ...prev.areas }
      delete areasErrors[key]
      return {
        ...prev,
        areas: Object.keys(areasErrors).length > 0 ? areasErrors : undefined,
      }
    })
  }

  function addArea() {
    setHasLocalAreas(true)
    setAreas((prev) => [
      ...prev,
      {
        key: nextDraftKey(),
        name: "",
        sort_order: prev.length,
        is_active: false,
      },
    ])
  }

  function onHasLocalAreasChange(checked: boolean) {
    setHasLocalAreas(checked)
    if (checked) {
      setAreas((prev) => {
        if (prev.length > 0) return prev
        return [
          {
            key: nextDraftKey(),
            name: "",
            sort_order: 0,
            is_active: false,
          },
        ]
      })
      return
    }
    // Unchecking clears empty draft rows that were never saved.
    setAreas((prev) => prev.filter((area) => area.id || area.name.trim()))
  }

  function updateAreaDraft(
    key: string,
    patch: Partial<Pick<AreaDraft, "name" | "sort_order" | "is_active">>
  ) {
    if (patch.name !== undefined) clearAreaError(key)
    setAreas((prev) =>
      prev.map((area) => (area.key === key ? { ...area, ...patch } : area))
    )
  }

  function removeArea(key: string) {
    clearAreaError(key)
    const next = areas
      .filter((area) => area.key !== key)
      .map((area, index) => ({ ...area, sort_order: index }))
    setAreas(next)
    if (next.length === 0) setHasLocalAreas(false)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors = {}
    if (!code.trim()) nextErrors.code = "Code is required"
    if (!name.trim()) nextErrors.name = "Name is required"

    const areaErrors: Record<string, string> = {}
    for (const area of areas) {
      if (!area.name.trim()) {
        areaErrors[area.key] = "Area name is required"
      }
    }
    if (Object.keys(areaErrors).length > 0) nextErrors.areas = areaErrors

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)

    const trimmedAreas = areas.map((area, index) => ({
      ...area,
      name: area.name.trim(),
      sort_order: index,
    }))

    const formData = new FormData()
    formData.set("code", code)
    formData.set("name", name)
    formData.set(
      "has_local_areas",
      hasLocalAreas || trimmedAreas.length > 0 ? "true" : "false"
    )
    formData.set("sort_order", String(sortOrder))
    formData.set("is_active", isActive ? "true" : "false")

    const result = isEdit
      ? await updateState(state!.code, formData)
      : await createState(formData)

    if (!result.ok) {
      toast.error(isEdit ? "Could not update state" : "Could not create state", {
        description: result.error,
      })
      setPending(false)
      return
    }

    const stateCode = isEdit ? state!.code : (result.code ?? code)
    const syncResult = await syncStateAreas(
      stateCode,
      trimmedAreas.map((area) => ({
        id: area.id,
        name: area.name,
        sort_order: area.sort_order,
        is_active: area.is_active,
      }))
    )

    if (!syncResult.ok) {
      toast.error("State saved, but areas failed", {
        description: syncResult.error,
      })
      setPending(false)
      return
    }

    toast.success(isEdit ? "State updated" : "State created")
    setPending(false)
    onSaved?.()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit state" : "Create state"}</SheetTitle>
        </SheetHeader>

        <form
          noValidate
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          <div className="space-y-2">
            <Label htmlFor="state-code">Code</Label>
            <Input
              id="state-code"
              value={code}
              onChange={(e) => {
                setCode(normalizeStateCode(e.target.value))
                clearError("code")
              }}
              placeholder="TX"
              disabled={isEdit}
              aria-invalid={Boolean(errors.code) || undefined}
              className="h-9 font-mono uppercase"
              maxLength={8}
            />
            <FieldError message={errors.code} />
            {isEdit ? (
              <p className="text-muted-foreground text-xs">
                Code is the primary key and cannot be changed after create.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state-name">Name</Label>
            <Input
              id="state-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                clearError("name")
              }}
              placeholder="Texas"
              aria-invalid={Boolean(errors.name) || undefined}
              className="h-9"
            />
            <FieldError message={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state-sort">Sort order</Label>
            <Input
              id="state-sort"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={hasLocalAreas}
              onCheckedChange={(checked) => onHasLocalAreasChange(checked)}
              className="after:hidden"
              aria-label="Has local areas"
            />
            <span className="text-sm">
              Has local areas
              <span className="text-muted-foreground block text-xs">
                Show the area question during onboarding for this state.
              </span>
            </span>
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

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Areas</p>
                <p className="text-muted-foreground text-xs">
                  Add or remove local areas for this state.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addArea}
                disabled={loadingAreas}
              >
                <Plus />
                Add area
              </Button>
            </div>

            {loadingAreas ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Loading areas…
              </p>
            ) : areas.length === 0 ? (
              <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
                No areas yet. Add the first one for onboarding.
              </p>
            ) : (
              <ul className="space-y-2">
                {areas.map((area, index) => (
                  <li
                    key={area.key}
                    className="flex items-start gap-2 rounded-lg border border-border/60 p-2"
                  >
                    <span className="text-muted-foreground mt-2 w-5 shrink-0 text-center text-xs tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Input
                        value={area.name}
                        onChange={(e) =>
                          updateAreaDraft(area.key, { name: e.target.value })
                        }
                        placeholder="Dallas County"
                        aria-invalid={
                          Boolean(errors.areas?.[area.key]) || undefined
                        }
                        className="h-9"
                        aria-label={`Area ${index + 1} name`}
                      />
                      <FieldError message={errors.areas?.[area.key]} />
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={area.is_active}
                          onCheckedChange={(checked) =>
                            updateAreaDraft(area.key, {
                              is_active: Boolean(checked),
                            })
                          }
                          className="after:hidden"
                          aria-label={`Area ${index + 1} active`}
                        />
                        <span className="text-muted-foreground text-xs">
                          Active
                        </span>
                      </label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeArea(area.key)}
                      aria-label={`Remove ${area.name || `area ${index + 1}`}`}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
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
            <Button
              type="submit"
              disabled={pending || loadingAreas || !areasReady}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create state"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
