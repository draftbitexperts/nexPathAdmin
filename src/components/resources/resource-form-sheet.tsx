import * as React from "react"
import { ArrowLeft, ImageIcon, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  clearResourceImage,
  createResourceCategory,
  createResource,
  syncResourceCategoryLinks,
  updateResource,
  uploadResourceImage,
  uploadResourceVideo,
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
  RESOURCE_VIDEO_MAX_BYTES,
  RESOURCE_VIDEO_MIME_TYPES,
  RESOURCE_TYPE_LABELS,
} from "@/lib/resources/constants"
import { CATEGORY_ICON_KEYS, slugify } from "@/lib/categories/constants"
import {
  RESOURCE_TYPES,
  type CategoryOption,
  type ProviderOption,
  type ResourceType,
  type ResourceWithRelations,
} from "@/lib/resources/types"
import { isValidHttpUrl } from "@/lib/utils"

const NO_CATEGORY = "__none__"

function categoryIdFromResource(
  resource: ResourceWithRelations | null
): string {
  return (
    [...(resource?.category_resources ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .at(0)?.category_id ?? ""
  )
}

type FieldErrors = {
  providerId?: string
  title?: string
  description?: string
  type?: string
  websiteUrl?: string
  phone?: string
  videoUrl?: string
  video?: string
  image?: string
  thumbnailUrl?: string
  category?: string
  newCategoryTitle?: string
  newCategorySlug?: string
  newCategorySubtitle?: string
  newCategoryDescription?: string
  newCategoryIcon?: string
}

function validateResourceFields(fields: {
  providerId: string
  title: string
  description: string
  type: ResourceType | null
  websiteUrl: string
  phone: string
  videoUrl: string
  hasVideoFile: boolean
  thumbnailUrl: string
  hasThumbnail: boolean
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!fields.providerId) errors.providerId = "Provider is required"
  if (!fields.title.trim()) errors.title = "Title is required"
  if (!fields.description.trim()) {
    errors.description = "Description is required"
  }
  if (!fields.type) {
    errors.type = "Type is required"
  }

  if (fields.type === "website") {
    if (!fields.websiteUrl.trim()) {
      errors.websiteUrl = "Website URL is required"
    } else if (!isValidHttpUrl(fields.websiteUrl)) {
      errors.websiteUrl = "Enter a valid website URL"
    }
  }
  if (fields.type === "hotline" && !fields.phone.trim()) {
    errors.phone = "Phone is required"
  }
  if (fields.type === "video") {
    if (!fields.videoUrl.trim() && !fields.hasVideoFile) {
      errors.videoUrl = "Video URL is required"
    } else if (fields.videoUrl && !isValidHttpUrl(fields.videoUrl)) {
      errors.videoUrl = "Enter a valid video URL"
    }
  }
  if (fields.thumbnailUrl && !isValidHttpUrl(fields.thumbnailUrl)) {
    errors.thumbnailUrl = "Enter a valid image URL"
  }
  if (!fields.hasThumbnail) {
    errors.thumbnailUrl = "Thumbnail is required"
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

function validateVideoFile(file: File): string | null {
  if (
    !RESOURCE_VIDEO_MIME_TYPES.includes(
      file.type as (typeof RESOURCE_VIDEO_MIME_TYPES)[number]
    )
  ) {
    return "Video must be MP4, WebM, or QuickTime"
  }
  if (file.size > RESOURCE_VIDEO_MAX_BYTES) {
    return "Video must be 100 MiB or smaller"
  }
  return null
}

type ResourceFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (resourceId: string) => void
  resource: ResourceWithRelations | null
  providers: ProviderOption[]
  categories: CategoryOption[]
  modal?: boolean
}

export function ResourceFormSheet({
  open,
  onOpenChange,
  onSaved,
  resource,
  providers,
  categories,
  modal = false,
}: ResourceFormSheetProps) {
  const isEdit = Boolean(resource)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const videoInputRef = React.useRef<HTMLInputElement>(null)
  const [pending, setPending] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)
  const [providerId, setProviderId] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [type, setType] = React.useState<ResourceType | null>(null)
  const [websiteUrl, setWebsiteUrl] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [videoUrl, setVideoUrl] = React.useState("")
  const [videoFile, setVideoFile] = React.useState<File | null>(null)
  const [isActive, setIsActive] = React.useState(false)
  const [categoryId, setCategoryId] = React.useState("")
  const [categoryMode, setCategoryMode] = React.useState<"existing" | "new">(
    "existing"
  )
  const [newCategoryTitle, setNewCategoryTitle] = React.useState("")
  const [newCategorySlug, setNewCategorySlug] = React.useState("")
  const [newCategorySlugTouched, setNewCategorySlugTouched] =
    React.useState(false)
  const [newCategorySubtitle, setNewCategorySubtitle] = React.useState("")
  const [newCategoryDescription, setNewCategoryDescription] =
    React.useState("")
  const [newCategoryIconKey, setNewCategoryIconKey] =
    React.useState<string>("folder")
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = React.useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(
    null
  )
  const [clearExistingImage, setClearExistingImage] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setProviderId(resource?.provider_id ?? "")
    setStep(1)
    setTitle(resource?.title ?? "")
    setDescription(resource?.description ?? "")
    setType(resource?.type ?? null)
    setWebsiteUrl(resource?.website_url ?? "")
    setPhone(resource?.phone ?? "")
    setVideoUrl(resource?.video_url ?? "")
    setVideoFile(null)
    setIsActive(resource?.is_active ?? false)
    setCategoryId(categoryIdFromResource(resource))
    setCategoryMode("existing")
    setNewCategoryTitle("")
    setNewCategorySlug("")
    setNewCategorySlugTouched(false)
    setNewCategorySubtitle("")
    setNewCategoryDescription("")
    setNewCategoryIconKey("folder")
    setImageFile(null)
    setThumbnailUrl("")
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
    (!clearExistingImage ? (thumbnailUrl || resource?.thumbnail || null) : null)

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
    clearError("websiteUrl")
    clearError("phone")
    clearError("videoUrl")
    clearError("video")
    // Clear payload fields that do not apply to the selected type.
    if (next !== "website") setWebsiteUrl("")
    if (next !== "hotline") setPhone("")
    if (next !== "video") {
      setVideoUrl("")
      setVideoFile(null)
    }
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
    setThumbnailUrl("")
    setClearExistingImage(false)
    clearError("image")
  }

  function onClearImage() {
    setImageFile(null)
    setThumbnailUrl("")
    setClearExistingImage(true)
    clearError("image")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function onVideoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) return

    const videoError = validateVideoFile(file)
    if (videoError) {
      setErrors((prev) => ({ ...prev, video: videoError }))
      return
    }

    setVideoFile(file)
    clearError("video")
    clearError("videoUrl")
  }

  function onClearVideo() {
    setVideoFile(null)
    setVideoUrl("")
    clearError("video")
    clearError("videoUrl")
    if (videoInputRef.current) videoInputRef.current.value = ""
  }

  function continueToCategories() {
    const nextErrors = validateResourceFields({
      providerId,
      title,
      description,
      type,
      websiteUrl,
      phone,
      videoUrl,
      hasVideoFile: Boolean(videoFile),
      thumbnailUrl,
      hasThumbnail: Boolean(
        imageFile ||
          thumbnailUrl ||
          (!clearExistingImage && resource?.thumbnail)
      ),
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) setStep(2)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step !== 2) {
      continueToCategories()
      return
    }

    const nextErrors = validateResourceFields({
      providerId,
      title,
      description,
      type,
      websiteUrl,
      phone,
      videoUrl,
      hasVideoFile: Boolean(videoFile),
      thumbnailUrl,
      hasThumbnail: Boolean(
        imageFile ||
          thumbnailUrl ||
          (!clearExistingImage && resource?.thumbnail)
      ),
    })
    if (
      categoryMode === "new" &&
      (!newCategoryTitle.trim() ||
        !newCategorySlug.trim() ||
        !newCategorySubtitle.trim() ||
        !newCategoryDescription.trim() ||
        !newCategoryIconKey)
    ) {
      if (!newCategoryTitle.trim()) {
        nextErrors.newCategoryTitle = "Title is required"
      }
      if (!newCategorySlug.trim()) {
        nextErrors.newCategorySlug = "Slug is required"
      }
      if (!newCategorySubtitle.trim()) {
        nextErrors.newCategorySubtitle = "Subtitle is required"
      }
      if (!newCategoryDescription.trim()) {
        nextErrors.newCategoryDescription = "Description is required"
      }
      if (!newCategoryIconKey) {
        nextErrors.newCategoryIcon = "Icon is required"
      }
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setPending(true)

    const formData = new FormData()
    formData.set("provider_id", providerId)
    formData.set("title", title)
    formData.set("description", description)
    formData.set("type", type!)
    formData.set("website_url", websiteUrl)
    formData.set("phone", phone)
    formData.set("video_url", videoUrl)
    formData.set("thumbnail_url", thumbnailUrl)
    formData.set("has_video_upload", videoFile ? "true" : "false")
    formData.set(
      "has_thumbnail",
      imageFile || thumbnailUrl || (!clearExistingImage && resource?.thumbnail)
        ? "true"
        : "false"
    )
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
    } else if (isEdit && clearExistingImage && resource?.thumbnail) {
      const clearResult = await clearResourceImage(resourceId)
      if (!clearResult.ok) {
        toast.error("Resource saved, but could not clear thumbnail", {
          description: clearResult.error,
        })
        setPending(false)
        return
      }
    }

    if (videoFile) {
      const uploadResult = await uploadResourceVideo(resourceId, videoFile)
      if (!uploadResult.ok) {
        toast.error("Resource saved, but video upload failed", {
          description: uploadResult.error,
        })
        setPending(false)
        return
      }
    }

    let linkCategoryIds = categoryId ? [categoryId] : []
    if (newCategoryTitle.trim()) {
      const categoryResult = await createResourceCategory({
        title: newCategoryTitle,
        slug: newCategorySlug,
        subtitle: newCategorySubtitle,
        description: newCategoryDescription,
        icon_key: newCategoryIconKey,
      })
      if (!categoryResult.ok || !categoryResult.id) {
        toast.error("Resource saved, but category creation failed", {
          description: categoryResult.ok
            ? "The new category did not return an id."
            : categoryResult.error,
        })
        setPending(false)
        return
      }
      linkCategoryIds = [...linkCategoryIds, categoryResult.id]
    }

    const linksResult = await syncResourceCategoryLinks(
      resourceId,
      linkCategoryIds.map((category_id, sort_order) => ({
        category_id,
        sort_order,
      }))
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
    onSaved?.(resourceId)
    onOpenChange(false)
  }

  const canSubmit = !pending && providers.length > 0 && Boolean(providerId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={
          modal
            ? "top-1/2! left-1/2! right-auto! h-[min(90vh,56rem)]! w-[calc(100%-2rem)]! max-w-3xl! -translate-x-1/2! -translate-y-1/2! rounded-xl border ring-1 ring-foreground/10 data-[side=right]:data-ending-style:translate-x-0 data-[side=right]:data-starting-style:translate-x-0"
            : "w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl data-[side=right]:sm:max-w-lg data-[side=right]:lg:max-w-xl data-[side=right]:xl:max-w-2xl"
        }
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 pr-10">
          <div className="flex items-center gap-2">
            {step === 2 ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setStep(1)}
                disabled={pending}
                aria-label="Back to resource details"
                title="Back to resource details"
              >
                <ArrowLeft />
              </Button>
            ) : null}
            <SheetTitle>
              {isEdit ? "Edit resource" : "Create resource"}
            </SheetTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              Step {step} / 2
            </span>
            <div className="bg-muted h-1 w-12 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full bg-primary transition-all ${
                  step === 1 ? "w-1/2" : "w-full"
                }`}
              />
            </div>
          </div>
        </SheetHeader>

        <form
          noValidate
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          {step === 1 ? (
            <>
          <div className="order-1 space-y-2">
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
              <SelectContent
                side="bottom"
                align="start"
                alignItemWithTrigger={false}
                collisionAvoidance={{ side: "none", fallbackAxisSide: "none" }}
                className="max-h-56"
              >
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

          <div className="order-2 space-y-2">
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

          <div className="order-4 space-y-2">
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

          <div className="order-5 space-y-2">
            <Label htmlFor="resource-description">Description</Label>
            <textarea
              id="resource-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                clearError("description")
              }}
              placeholder="Explore careers, find training, and search for jobs."
              rows={4}
              aria-invalid={Boolean(errors.description) || undefined}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-y rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30"
            />
            <FieldError message={errors.description} />
          </div>

          <div className="order-6 space-y-2">
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
                <Input
                  id="resource-thumbnail-url"
                  type="url"
                  value={thumbnailUrl}
                  onChange={(event) => {
                    setThumbnailUrl(event.target.value)
                    setImageFile(null)
                    setClearExistingImage(false)
                    clearError("thumbnailUrl")
                  }}
                  placeholder="Or paste an image URL"
                  aria-invalid={Boolean(errors.thumbnailUrl) || undefined}
                  className="h-9"
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
                    Upload a JPEG, PNG, or WebP (max 2 MiB), or paste an image URL.
                  </p>
                </div>
              </div>
            </div>
            <FieldError message={errors.thumbnailUrl ?? errors.image} />
          </div>

          {type === "website" ? (
            <div className="order-3 space-y-2">
              <Label htmlFor="resource-website-url">Website URL</Label>
              <Input
                id="resource-website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value)
                  clearError("websiteUrl")
                }}
                onBlur={() => {
                  if (websiteUrl.trim() && !isValidHttpUrl(websiteUrl)) {
                    setErrors((current) => ({
                      ...current,
                      websiteUrl: "Enter a valid website URL",
                    }))
                  }
                }}
                placeholder="https://…"
                aria-invalid={Boolean(errors.websiteUrl) || undefined}
                className="h-9"
              />
              <FieldError message={errors.websiteUrl} />
            </div>
          ) : null}

          {type === "video" ? (
            <div className="order-3 space-y-2">
              <Label htmlFor="resource-video-file">Video URL or upload</Label>
              <div className="space-y-2">
                  <Input
                    ref={videoInputRef}
                    id="resource-video-file"
                    type="file"
                    accept={RESOURCE_VIDEO_MIME_TYPES.join(",")}
                    onChange={onVideoChange}
                    disabled={Boolean(videoUrl)}
                    aria-invalid={Boolean(errors.video) || undefined}
                    className="h-9 cursor-pointer file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  />
                  <FieldError message={errors.video} />
                  <Input
                    id="resource-video-url"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value)
                      clearError("videoUrl")
                    }}
                    onBlur={() => {
                      if (videoUrl.trim() && !isValidHttpUrl(videoUrl)) {
                        setErrors((current) => ({
                          ...current,
                          videoUrl: "Enter a valid video URL",
                        }))
                      }
                    }}
                    disabled={Boolean(videoFile)}
                    placeholder="Or paste a video URL"
                    aria-invalid={Boolean(errors.videoUrl) || undefined}
                    className="h-9"
                  />
                  <FieldError message={errors.videoUrl} />
                  <p className="text-muted-foreground text-xs">
                    Upload an MP4, WebM, or QuickTime (max 100 MiB), or paste
                    a public video URL.
                  </p>
                  {videoFile || videoUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onClearVideo}
                      disabled={pending}
                    >
                      Clear video
                    </Button>
                  ) : null}
              </div>
            </div>
          ) : null}

          {type === "hotline" ? (
            <div className="order-3 space-y-2">
              <Label htmlFor="resource-phone">Phone</Label>
              <Input
                id="resource-phone"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""))
                  clearError("phone")
                }}
                placeholder="18005550100"
                aria-invalid={Boolean(errors.phone) || undefined}
                className="h-9"
              />
              <FieldError message={errors.phone} />
            </div>
          ) : null}

          <div className="order-7 flex items-center gap-2">
            <Checkbox
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked)}
              className="after:hidden"
              aria-label="Active"
            />
            <span className="text-sm">Active</span>
          </div>

            </>
          ) : null}

          {step === 2 ? (
          <section className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
            <div>
              <h3 className="text-sm font-semibold">
                Link this resource to a category
              </h3>
              <p className="text-muted-foreground text-xs">
                Optional — you can save now and link a category later.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant={categoryMode === "existing" ? "default" : "outline"}
                onClick={() => {
                  setCategoryMode("existing")
                  setNewCategoryTitle("")
                }}
              >
                Choose existing
              </Button>
              <Button
                type="button"
                size="sm"
                variant={categoryMode === "new" ? "default" : "outline"}
                onClick={() => {
                  setCategoryMode("new")
                  setCategoryId("")
                }}
              >
                Create new
              </Button>
            </div>

            {categoryMode === "existing" ? (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={categoryId || NO_CATEGORY}
                  onValueChange={(value) => {
                    setCategoryId(
                      !value || value === NO_CATEGORY ? "" : value
                    )
                  }}
                  items={{
                    [NO_CATEGORY]: "No category",
                    ...Object.fromEntries(
                      categories.map((category) => [category.id, category.title])
                    ),
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent
                    side="bottom"
                    align="start"
                    alignItemWithTrigger={false}
                    collisionAvoidance={{ side: "none", fallbackAxisSide: "none" }}
                    className="max-h-56"
                  >
                    <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No active categories yet. Create one to continue.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="resource-new-category">Title</Label>
                  <Input
                    id="resource-new-category"
                    value={newCategoryTitle}
                    onChange={(event) => {
                      const title = event.target.value
                      setNewCategoryTitle(title)
                      clearError("newCategoryTitle")
                      if (!newCategorySlugTouched) {
                        setNewCategorySlug(slugify(title))
                        clearError("newCategorySlug")
                      }
                    }}
                    placeholder="e.g. Career support"
                    aria-invalid={Boolean(errors.newCategoryTitle) || undefined}
                    className="h-9"
                  />
                  <FieldError message={errors.newCategoryTitle} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource-new-category-slug">Slug</Label>
                  <Input
                    id="resource-new-category-slug"
                    value={newCategorySlug}
                    onChange={(event) => {
                      setNewCategorySlugTouched(true)
                      setNewCategorySlug(slugify(event.target.value))
                      clearError("newCategorySlug")
                    }}
                    placeholder="career_support"
                    aria-invalid={Boolean(errors.newCategorySlug) || undefined}
                    className="h-9 font-mono text-xs"
                  />
                  <FieldError message={errors.newCategorySlug} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource-new-category-subtitle">Subtitle</Label>
                  <Input
                    id="resource-new-category-subtitle"
                    value={newCategorySubtitle}
                    onChange={(event) => {
                      setNewCategorySubtitle(event.target.value)
                      clearError("newCategorySubtitle")
                    }}
                    placeholder="A short supporting line"
                    aria-invalid={Boolean(errors.newCategorySubtitle) || undefined}
                    className="h-9"
                  />
                  <FieldError message={errors.newCategorySubtitle} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource-new-category-description">
                    Description
                  </Label>
                  <textarea
                    id="resource-new-category-description"
                    value={newCategoryDescription}
                    onChange={(event) => {
                      setNewCategoryDescription(event.target.value)
                      clearError("newCategoryDescription")
                    }}
                    placeholder="Why this category is important…"
                    rows={3}
                    aria-invalid={
                      Boolean(errors.newCategoryDescription) || undefined
                    }
                    className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-y rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30"
                  />
                  <FieldError message={errors.newCategoryDescription} />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select
                    value={newCategoryIconKey}
                    onValueChange={(value) => {
                      if (value) {
                        setNewCategoryIconKey(value)
                        clearError("newCategoryIcon")
                      }
                    }}
                    items={Object.fromEntries(
                      CATEGORY_ICON_KEYS.map((key) => [key, key])
                    )}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent
                      side="bottom"
                      align="start"
                      alignItemWithTrigger={false}
                      collisionAvoidance={{ side: "none", fallbackAxisSide: "none" }}
                      className="max-h-56"
                    >
                      {CATEGORY_ICON_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={errors.newCategoryIcon} />
                </div>
                <p className="text-muted-foreground text-xs">
                  The category will be created and linked when you submit.
                </p>
              </div>
            )}
            <FieldError message={errors.category} />
          </section>
          ) : null}

          <SheetFooter className="order-10 mt-auto px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            {step === 1 ? (
              <Button
                type="button"
                onClick={continueToCategories}
                disabled={!canSubmit}
              >
                Continue to category
              </Button>
            ) : (
              <>
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
              </>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
