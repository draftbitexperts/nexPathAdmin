import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  createCategory,
  syncCategoryPlacements,
  updateCategory,
} from "@/lib/categories/actions"
import { FieldError } from "@/components/field-error"
import {
  OrderedTogglePicker,
  type OrderedToggleSelection,
} from "@/components/ordered-toggle-picker"
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
import {
  CATEGORY_ICON_KEYS,
  SURFACE_LABELS,
  slugify,
} from "@/lib/categories/constants"
import { categoryIcon } from "@/lib/categories/icons"
import {
  CATEGORY_SURFACES,
  type CategorySurface,
  type CategoryWithPlacements,
  type PlacementInput,
} from "@/lib/categories/types"
import { cn } from "@/lib/utils"

type PlacementDraft = Record<
  CategorySurface,
  { enabled: boolean; sort_order: number }
>

type FieldErrors = {
  name?: string
  slug?: string
}

function placementsFromCategory(
  category: CategoryWithPlacements | null
): PlacementDraft {
  const draft = Object.fromEntries(
    CATEGORY_SURFACES.map((surface) => [
      surface,
      { enabled: false, sort_order: 0 },
    ])
  ) as PlacementDraft

  for (const placement of category?.category_placements ?? []) {
    draft[placement.surface] = {
      enabled: true,
      sort_order: placement.sort_order,
    }
  }

  return draft
}

type CategoryFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  category: CategoryWithPlacements | null
}

export function CategoryFormSheet({
  open,
  onOpenChange,
  onSaved,
  category,
}: CategoryFormSheetProps) {
  const isEdit = Boolean(category)
  const [pending, setPending] = React.useState(false)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [slugTouched, setSlugTouched] = React.useState(false)
  const [shortDescription, setShortDescription] = React.useState("")
  const [longDescription, setLongDescription] = React.useState("")
  const [iconKey, setIconKey] = React.useState<string>("folder")
  const [isActive, setIsActive] = React.useState(false)
  const [placements, setPlacements] = React.useState<PlacementDraft>(
    placementsFromCategory(null)
  )
  const [errors, setErrors] = React.useState<FieldErrors>({})

  React.useEffect(() => {
    if (!open) return
    setName(category?.name ?? "")
    setSlug(category?.slug ?? "")
    setSlugTouched(Boolean(category))
    setShortDescription(category?.short_description ?? "")
    setLongDescription(category?.long_description ?? "")
    setIconKey(category?.icon_key ?? "folder")
    setIsActive(category?.is_active ?? false)
    setPlacements(placementsFromCategory(category))
    setErrors({})
  }, [open, category])

  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function onNameChange(value: string) {
    setName(value)
    clearError("name")
    if (!isEdit && !slugTouched) {
      setSlug(slugify(value))
      clearError("slug")
    }
  }

  function toPlacementInputs(): PlacementInput[] {
    return CATEGORY_SURFACES.filter((surface) => placements[surface].enabled)
      .map((surface) => ({
        surface,
        sort_order: placements[surface].sort_order,
      }))
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  function placementSelection(): OrderedToggleSelection[] {
    return CATEGORY_SURFACES.filter((surface) => placements[surface].enabled).map(
      (surface) => ({
        id: surface,
        sort_order: placements[surface].sort_order,
      })
    )
  }

  function onPlacementsChange(next: OrderedToggleSelection[]) {
    const selected = new Map(next.map((item) => [item.id, item.sort_order]))
    setPlacements((prev) => {
      const draft = { ...prev }
      for (const surface of CATEGORY_SURFACES) {
        const sortOrder = selected.get(surface)
        draft[surface] =
          sortOrder === undefined
            ? { enabled: false, sort_order: 0 }
            : { enabled: true, sort_order: sortOrder }
      }
      return draft
    })
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FieldErrors = {}
    if (!name.trim()) nextErrors.name = "Name is required"
    if (!slug.trim()) nextErrors.slug = "Slug is required"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)

    const formData = new FormData()
    formData.set("name", name)
    formData.set("slug", slug)
    formData.set("short_description", shortDescription)
    formData.set("long_description", longDescription)
    formData.set("icon_key", iconKey)
    formData.set("is_active", isActive ? "true" : "false")

    const result = isEdit
      ? await updateCategory(category!.id, formData)
      : await createCategory(formData)

    if (!result.ok) {
      toast.error(isEdit ? "Could not update category" : "Could not create category", {
        description: result.error,
      })
      setPending(false)
      return
    }

    const categoryId = isEdit ? category!.id : result.id
    if (categoryId) {
      const placementResult = await syncCategoryPlacements(
        categoryId,
        toPlacementInputs()
      )
      if (!placementResult.ok) {
        toast.error("Category saved, but placements failed", {
          description: placementResult.error,
        })
        setPending(false)
        return
      }
    }

    toast.success(isEdit ? "Category updated" : "Category created")
    setPending(false)
    onSaved?.()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl data-[side=right]:sm:max-w-lg data-[side=right]:lg:max-w-xl data-[side=right]:xl:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit category" : "Create category"}</SheetTitle>
        </SheetHeader>

        <form
          noValidate
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Transportation"
              aria-invalid={Boolean(errors.name) || undefined}
              className="h-9"
            />
            <FieldError message={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-slug">Slug</Label>
            <Input
              id="category-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugify(e.target.value))
                clearError("slug")
              }}
              placeholder="transportation"
              disabled={isEdit}
              aria-invalid={Boolean(errors.slug) || undefined}
              className="h-9 font-mono text-xs"
            />
            <FieldError message={errors.slug} />
            {isEdit ? (
              <p className="text-muted-foreground text-xs">
                Slug is stable and cannot be changed after create.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-short">Short description</Label>
            <Input
              id="category-short"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Get where you need to go"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-long">Long description</Label>
            <textarea
              id="category-long"
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Why it's important…"
              rows={4}
              className={cn(
                "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 md:text-sm dark:bg-input/30"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_ICON_KEYS.map((key) => {
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

          <div className="flex items-center gap-2">
            <Checkbox
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked)}
              className="after:hidden"
              aria-label="Active"
            />
            <span className="text-sm">Active</span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Placements</p>
            <OrderedTogglePicker
              items={CATEGORY_SURFACES.map((surface) => ({
                id: surface,
                label: SURFACE_LABELS[surface],
              }))}
              selected={placementSelection()}
              onChange={onPlacementsChange}
              orderHeading="Carousel order"
              emptyOrderHint="Select a surface above to set carousel order."
            />
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
                "Create category"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
