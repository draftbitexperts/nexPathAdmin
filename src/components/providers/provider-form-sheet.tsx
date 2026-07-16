"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  createProvider,
  updateProvider,
} from "@/app/dashboard/providers/actions"
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
import type { Provider } from "@/lib/providers/types"
import { cn } from "@/lib/utils"

type FieldErrors = {
  name?: string
}

type ProviderFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: Provider | null
}

export function ProviderFormSheet({
  open,
  onOpenChange,
  provider,
}: ProviderFormSheetProps) {
  const isEdit = Boolean(provider)
  const [pending, setPending] = React.useState(false)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [logoUrl, setLogoUrl] = React.useState("")
  const [isActive, setIsActive] = React.useState(false)
  const [errors, setErrors] = React.useState<FieldErrors>({})

  React.useEffect(() => {
    if (!open) return
    setName(provider?.name ?? "")
    setDescription(provider?.description ?? "")
    setLogoUrl(provider?.logo_url ?? "")
    setIsActive(provider?.is_active ?? false)
    setErrors({})
  }, [open, provider])

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
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)

    const formData = new FormData()
    formData.set("name", name)
    formData.set("description", description)
    formData.set("logo_url", logoUrl)
    formData.set("is_active", isActive ? "true" : "false")

    const result = isEdit
      ? await updateProvider(provider!.id, formData)
      : await createProvider(formData)

    if (!result.ok) {
      toast.error(
        isEdit ? "Could not update provider" : "Could not create provider",
        { description: result.error }
      )
      setPending(false)
      return
    }

    toast.success(isEdit ? "Provider updated" : "Provider created")
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
            {isEdit ? "Edit provider" : "Create provider"}
          </SheetTitle>
        </SheetHeader>

        <form
          noValidate
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          <div className="space-y-2">
            <Label htmlFor="provider-name">Name</Label>
            <Input
              id="provider-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                clearError("name")
              }}
              placeholder="CareerOneStop"
              aria-invalid={Boolean(errors.name) || undefined}
              className="h-9"
            />
            <FieldError message={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-description">Description</Label>
            <textarea
              id="provider-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="U.S. Department of Labor career and job search resource."
              rows={3}
              className={cn(
                "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 md:text-sm dark:bg-input/30"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-logo">Logo URL</Label>
            <Input
              id="provider-logo"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="h-9"
            />
            {logoUrl ? (
              <div className="bg-muted/40 mt-2 flex size-12 items-center justify-center overflow-hidden rounded-lg border border-border/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt=""
                  className="size-full object-contain"
                />
              </div>
            ) : null}
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
                "Create provider"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
