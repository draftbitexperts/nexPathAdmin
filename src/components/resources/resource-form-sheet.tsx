import * as React from "react"
import { ImageIcon, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  clearResourceImage,
  createResource,
  syncResourceCategoryLinks,
  updateResource,
  uploadResourceImage,
} from "@/lib/resources/actions"
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
  RESOURCE_IMAGE_MAX_BYTES,
  RESOURCE_IMAGE_MIME_TYPES,
  RESOURCE_TYPE_LABELS,
} from "@/lib/resources/constants"
import {
  RESOURCE_TYPES,
  type CategoryOption,
  type ProviderOption,
  type ResourceType,
  type ResourceWithRelations,
} from "@/lib/resources/types"
import { cn } from "@/lib/utils"

const NO_CATEGORY = "__none__"

function categoryIdFromResource(
  resource: ResourceWithRelations | null
): string {
  const links = [...(resource?.category_resources ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  return links[0]?.category_id ?? ""
}

type FieldErrors = {
  providerId?: string
  title?: string
  type?: string
  url?: string
  phone?: string
  videoId?: string
  body?: string
  image?: string
}

function validateResourceFields(fields: {
  providerId: string
  title: string
  type: ResourceType | null
  url: string
  phone: string
  videoId: string
  body: string
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!fields.providerId) errors.providerId = "Provider is required"
  if (!fields.title.trim()) errors.title = "Title is required"
  if (!fields.type) {
    errors.type = "Type is required"
    return errors
  }

  if (fields.type === "website" && !fields.url.trim()) {
    errors.url = "URL is required"
  }
  if (fields.type === "hotline" && !fields.phone.trim()) {
    errors.phone = "Phone is required"
  }
  if (fields.type === "youtube") {
    if (!fields.url.trim() && !fields.videoId.trim()) {
      errors.url = "URL or video ID is required"
      errors.videoId = "URL or video ID is required"
    }
  }
  if (fields.type === "text" && !fields.body.trim()) {
    errors.body = "Body is required"
  }

  return errors
}

function validateImageFile(file: File): string | null {
  if (
    !RESOURCE_IMAGE_MIME_TYPES.includes(
      file.type as (typeof RESOURCE_IMAGE_MIME_TYPES)[number]
    )
  ) {
    return "Image must be JPEG, PNG, or WebP"
  }
  if (file.size > RESOURCE_IMAGE_MAX_BYTES) {
    return "Image must be 2 MiB or smaller"
  }
  return null
}

type ResourceFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  resource: ResourceWithRelations | null
  providers: ProviderOption[]
  categories: CategoryOption[]
}

export function ResourceFormSheet({
  open,
  onOpenChange,
  onSaved,
  resource,
  providers,
  categories,
}: ResourceFormSheetProps) {
  const isEdit = Boolean(resource)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [pending, setPending] = React.useState(false)
  const [providerId, setProviderId] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [carouselLabel, setCarouselLabel] = React.useState("")
  const [summary, setSummary] = React.useState("")
  const [type, setType] = React.useState<ResourceType | null>(null)
  const [url, setUrl] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [videoId, setVideoId] = React.useState("")
  const [body, setBody] = React.useState("")
  const [isActive, setIsActive] = React.useState(false)
  const [categoryId, setCategoryId] = React.useState("")
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(
    null
  )
  const [clearExistingImage, setClearExistingImage] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setProviderId(resource?.provider_id ?? "")
    setTitle(resource?.title ?? "")
    setCarouselLabel(resource?.carousel_label ?? "")
    setSummary(resource?.summary ?? "")
    setType(resource?.type ?? null)
    setUrl(resource?.url ?? "")
    setPhone(resource?.phone ?? "")
    setVideoId(resource?.video_id ?? "")
    setBody(resource?.body ?? "")
    setIsActive(resource?.is_active ?? false)
    setCategoryId(categoryIdFromResource(resource))
    setImageFile(null)
    setClearExistingImage(false)
    setErrors({})
  }, [open, resource])

  React.useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(imageFile)
    setImagePreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  const displayedImageUrl =
    imagePreviewUrl ??
    (!clearExistingImage ? (resource?.image_url ?? null) : null)

  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function onTypeChange(value: string | null) {
    if (!value) return
    const next = value as ResourceType
    setType(next)
    clearError("type")
    clearError("url")
    clearError("phone")
    clearError("videoId")
    clearError("body")
    // Clear payload fields that do not apply to the selected type.
    if (next !== "website" && next !== "youtube") setUrl("")
    if (next !== "hotline") setPhone("")
    if (next !== "youtube") setVideoId("")
    if (next !== "text") setBody("")
  }

  function onImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    event.target.value = ""
    if (!file) return

    const imageError = validateImageFile(file)
    if (imageError) {
      setErrors((prev) => ({ ...prev, image: imageError }))
      return
    }

    setImageFile(file)
    setClearExistingImage(false)
    clearError("image")
  }

  function onClearImage() {
    setImageFile(null)
    setClearExistingImage(true)
    clearError("image")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateResourceFields({
      providerId,
      title,
      type,
      url,
      phone,
      videoId,
      body,
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)

    const formData = new FormData()
    formData.set("provider_id", providerId)
    formData.set("title", title)
    formData.set("carousel_label", carouselLabel)
    formData.set("summary", summary)
    formData.set("type", type!)
    formData.set("url", url)
    formData.set("phone", phone)
    formData.set("video_id", videoId)
    formData.set("body", body)
    formData.set("is_active", isActive ? "true" : "false")

    const result = isEdit
      ? await updateResource(resource!.id, formData)
      : await createResource(formData)

    if (!result.ok) {
      toast.error(
        isEdit ? "Could not update resource" : "Could not create resource",
        { description: result.error }
      )
      setPending(false)
      return
    }

    const resourceId = isEdit ? resource!.id : result.id
    if (!resourceId) {
      toast.error("Resource saved, but missing id for follow-up steps")
      setPending(false)
      return
    }

    if (imageFile) {
      const uploadResult = await uploadResourceImage(resourceId, imageFile)
      if (!uploadResult.ok) {
        toast.error("Resource saved, but thumbnail upload failed", {
          description: uploadResult.error,
        })
        setPending(false)
        return
      }
    } else if (isEdit && clearExistingImage && resource?.image_url) {
      const clearResult = await clearResourceImage(resourceId)
      if (!clearResult.ok) {
        toast.error("Resource saved, but could not clear thumbnail", {
          description: clearResult.error,
        })
        setPending(false)
        return
      }
    }

    const linksResult = await syncResourceCategoryLinks(
      resourceId,
      categoryId ? [{ category_id: categoryId, sort_order: 0 }] : []
    )
    if (!linksResult.ok) {
      toast.error("Resource saved, but category links failed", {
        description: linksResult.error,
      })
      setPending(false)
      return
    }

    toast.success(isEdit ? "Resource updated" : "Resource created")
    setPending(false)
    onSaved?.()
    onOpenChange(false)
  }

  const textareaClassName = cn(
    "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 md:text-sm dark:bg-input/30",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
  )

  const canSubmit = !pending && providers.length > 0 && Boolean(providerId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl data-[side=right]:sm:max-w-lg data-[side=right]:lg:max-w-xl data-[side=right]:xl:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Edit resource" : "Create resource"}
          </SheetTitle>
        </SheetHeader>

        <form
          noValidate
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={providerId || null}
              onValueChange={(value) => {
                if (value) {
                  setProviderId(value)
                  clearError("providerId")
                }
              }}
              items={Object.fromEntries(
                providers.map((provider) => [provider.id, provider.name])
              )}
            >
              <SelectTrigger
                className="h-9 w-full"
                aria-invalid={Boolean(errors.providerId) || undefined}
              >
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
            <FieldError message={errors.providerId} />
            {providers.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No providers found. Create a provider before adding resources.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-title">Title</Label>
            <Input
              id="resource-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                clearError("title")
              }}
              placeholder="CareerOneStop Job Search"
              aria-invalid={Boolean(errors.title) || undefined}
              className="h-9"
            />
            <FieldError message={errors.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-image">Thumbnail</Label>
            <div className="flex items-center gap-4">
              <div className="bg-muted/40 flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 sm:size-32">
                {displayedImageUrl ? (
                  <img
                    src={displayedImageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="text-muted-foreground size-8" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  ref={fileInputRef}
                  id="resource-image"
                  type="file"
                  accept={RESOURCE_IMAGE_MIME_TYPES.join(",")}
                  onChange={onImageChange}
                  aria-invalid={Boolean(errors.image) || undefined}
                  className="h-9 cursor-pointer file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                />
                <div className="flex flex-wrap items-center gap-2">
                  {displayedImageUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onClearImage}
                      disabled={pending}
                    >
                      <Trash2 />
                      Clear thumbnail
                    </Button>
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    JPEG, PNG, or WebP · max 2 MiB. Stored in resource-images.
                  </p>
                </div>
              </div>
            </div>
            <FieldError message={errors.image} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-carousel-label">Carousel label</Label>
            <Input
              id="resource-carousel-label"
              value={carouselLabel}
              onChange={(e) => setCarouselLabel(e.target.value)}
              placeholder="Career OneStop"
              className="h-9"
            />
            <p className="text-muted-foreground text-xs">
              Short label for carousels; falls back to title.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-summary">Summary</Label>
            <Input
              id="resource-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Explore careers, find training, and search for jobs."
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={onTypeChange}
              items={RESOURCE_TYPE_LABELS}
            >
              <SelectTrigger
                className="h-9 w-full"
                aria-invalid={Boolean(errors.type) || undefined}
              >
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent
                side="bottom"
                align="start"
                alignItemWithTrigger={false}
                collisionAvoidance={{ side: "none", fallbackAxisSide: "none" }}
                className="max-h-56"
              >
                {RESOURCE_TYPES.map((resourceType) => (
                  <SelectItem key={resourceType} value={resourceType}>
                    {RESOURCE_TYPE_LABELS[resourceType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.type} />
          </div>

          {type === "website" ? (
            <div className="space-y-2">
              <Label htmlFor="resource-url">URL</Label>
              <Input
                id="resource-url"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  clearError("url")
                }}
                placeholder="https://…"
                aria-invalid={Boolean(errors.url) || undefined}
                className="h-9"
              />
              <FieldError message={errors.url} />
            </div>
          ) : null}

          {type === "youtube" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="resource-url">URL</Label>
                <Input
                  id="resource-url"
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    clearError("url")
                    clearError("videoId")
                  }}
                  placeholder="https://www.youtube.com/watch?v=…"
                  aria-invalid={Boolean(errors.url) || undefined}
                  className="h-9"
                />
                <FieldError message={errors.url} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-video-id">Video ID</Label>
                <Input
                  id="resource-video-id"
                  value={videoId}
                  onChange={(e) => {
                    setVideoId(e.target.value)
                    clearError("videoId")
                    clearError("url")
                  }}
                  placeholder="dQw4w9WgXcQ"
                  aria-invalid={Boolean(errors.videoId) || undefined}
                  className="h-9 font-mono text-xs"
                />
                <FieldError message={errors.videoId} />
                {!errors.videoId ? (
                  <p className="text-muted-foreground text-xs">
                    Provide a YouTube URL or video ID (at least one required).
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          {type === "hotline" ? (
            <div className="space-y-2">
              <Label htmlFor="resource-phone">Phone</Label>
              <Input
                id="resource-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  clearError("phone")
                }}
                placeholder="1-800-555-0100"
                aria-invalid={Boolean(errors.phone) || undefined}
                className="h-9"
              />
              <FieldError message={errors.phone} />
            </div>
          ) : null}

          {type === "text" ? (
            <div className="space-y-2">
              <Label htmlFor="resource-body">Body</Label>
              <textarea
                id="resource-body"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value)
                  clearError("body")
                }}
                placeholder="Guidance or informational copy…"
                rows={5}
                aria-invalid={Boolean(errors.body) || undefined}
                className={textareaClassName}
              />
              <FieldError message={errors.body} />
            </div>
          ) : null}

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
            <Label>Category</Label>
            <Select
              value={categoryId || NO_CATEGORY}
              onValueChange={(value) => {
                if (!value || value === NO_CATEGORY) {
                  setCategoryId("")
                  return
                }
                setCategoryId(value)
              }}
              items={{
                [NO_CATEGORY]: "No category",
                ...Object.fromEntries(
                  categories.map((category) => [category.id, category.name])
                ),
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No active categories yet.
              </p>
            ) : null}
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
                "Create resource"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
