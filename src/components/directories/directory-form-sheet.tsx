import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  createDirectory,
  updateDirectory,
} from "@/lib/directories/actions"
import { listAreasForDirectorySelect } from "@/lib/directories/queries"
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
import type {
  AreaOption,
  DirectoryWithRelations,
} from "@/lib/directories/types"
import type { StateOption } from "@/lib/locations/types"
import { cn } from "@/lib/utils"

type FieldErrors = {
  name?: string
  externalUrl?: string
  stateCode?: string
}

type DirectoryFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  directory: DirectoryWithRelations | null
  stateOptions: StateOption[]
}

const STATEWIDE_VALUE = "__statewide__"

export function DirectoryFormSheet({
  open,
  onOpenChange,
  onSaved,
  directory,
  stateOptions,
}: DirectoryFormSheetProps) {
  const isEdit = Boolean(directory)
  const [pending, setPending] = React.useState(false)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [externalUrl, setExternalUrl] = React.useState("")
  const [stateCode, setStateCode] = React.useState("")
  const [areaId, setAreaId] = React.useState<string>(STATEWIDE_VALUE)
  const [areaOptions, setAreaOptions] = React.useState<AreaOption[]>([])
  const [areasLoading, setAreasLoading] = React.useState(false)
  const [isJuvenileJusticeCentered, setIsJuvenileJusticeCentered] =
    React.useState(false)
  const [isActive, setIsActive] = React.useState(true)
  const [errors, setErrors] = React.useState<FieldErrors>({})

  React.useEffect(() => {
    if (!open) return
    setName(directory?.name ?? "")
    setDescription(directory?.description ?? "")
    setExternalUrl(directory?.external_url ?? "")
    setStateCode(directory?.state_code ?? "")
    setAreaId(directory?.area_id ?? STATEWIDE_VALUE)
    setIsJuvenileJusticeCentered(
      directory?.is_juvenile_justice_centered ?? false
    )
    setIsActive(directory?.is_active ?? true)
    setErrors({})
  }, [open, directory])

  React.useEffect(() => {
    if (!open || !stateCode) {
      setAreaOptions([])
      return
    }

    let cancelled = false
    setAreasLoading(true)

    void listAreasForDirectorySelect(stateCode)
      .then((areas) => {
        if (cancelled) return
        setAreaOptions(areas)
        setAreaId((current) => {
          if (current === STATEWIDE_VALUE) return current
          return areas.some((a) => a.id === current) ? current : STATEWIDE_VALUE
        })
      })
      .catch((err) => {
        if (cancelled) return
        toast.error("Could not load areas", {
          description: err instanceof Error ? err.message : String(err),
        })
        setAreaOptions([])
      })
      .finally(() => {
        if (!cancelled) setAreasLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, stateCode])

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
    if (!name.trim()) nextErrors.name = "Name is required"
    if (!externalUrl.trim()) nextErrors.externalUrl = "External URL is required"
    if (!stateCode) nextErrors.stateCode = "State is required"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)

    const formData = new FormData()
    formData.set("name", name)
    formData.set("description", description)
    formData.set("external_url", externalUrl)
    formData.set("state_code", stateCode)
    formData.set(
      "area_id",
      areaId === STATEWIDE_VALUE ? "" : areaId
    )
    formData.set(
      "is_juvenile_justice_centered",
      isJuvenileJusticeCentered ? "true" : "false"
    )
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
    onSaved?.()
    onOpenChange(false)
  }

  const stateItems = Object.fromEntries(
    stateOptions.map((s) => [s.code, `${s.name} (${s.code})`])
  )

  const areaItems = Object.fromEntries([
    [STATEWIDE_VALUE, "Statewide (all areas)"],
    ...areaOptions.map((a) => [a.id, a.name]),
  ])

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
          noValidate
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          <div className="space-y-2">
            <Label htmlFor="directory-name">Name</Label>
            <Input
              id="directory-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                clearError("name")
              }}
              placeholder="New Jersey Resource Net"
              aria-invalid={Boolean(errors.name) || undefined}
              className="h-9"
            />
            <FieldError message={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="directory-description">Description</Label>
            <textarea
              id="directory-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Statewide directory of reentry and community services in New Jersey."
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
              onChange={(e) => {
                setExternalUrl(e.target.value)
                clearError("externalUrl")
              }}
              placeholder="https://www.nj.gov"
              aria-invalid={Boolean(errors.externalUrl) || undefined}
              className="h-9"
            />
            <FieldError message={errors.externalUrl} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="directory-state">State</Label>
            <Select
              value={stateCode || null}
              onValueChange={(value) => {
                if (value) {
                  setStateCode(value)
                  setAreaId(STATEWIDE_VALUE)
                  clearError("stateCode")
                }
              }}
              items={stateItems}
            >
              <SelectTrigger
                id="directory-state"
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
                {stateOptions.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name} ({state.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.stateCode} />
            {stateOptions.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No states found. Create a state before adding directories.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="directory-area">Area</Label>
            <Select
              value={areaId}
              onValueChange={(value) => {
                if (value) setAreaId(value)
              }}
              disabled={!stateCode || areasLoading}
              items={areaItems}
            >
              <SelectTrigger id="directory-area" className="h-9 w-full">
                <SelectValue
                  placeholder={
                    areasLoading ? "Loading areas…" : "Statewide (all areas)"
                  }
                />
              </SelectTrigger>
              <SelectContent
                side="bottom"
                align="start"
                alignItemWithTrigger={false}
                collisionAvoidance={{ side: "none", fallbackAxisSide: "none" }}
                className="max-h-56"
              >
                <SelectItem value={STATEWIDE_VALUE}>
                  Statewide (all areas)
                </SelectItem>
                {areaOptions.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Leave statewide so all users in the state see it; pick an area to
              limit visibility to that region.
            </p>
          </div>

          <label className="flex items-center gap-2">
            <Checkbox
              checked={isJuvenileJusticeCentered}
              onCheckedChange={(checked) =>
                setIsJuvenileJusticeCentered(checked)
              }
            />
            <span className="text-sm">Juvenile justice centered</span>
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
            <Button type="submit" disabled={pending || stateOptions.length === 0}>
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
