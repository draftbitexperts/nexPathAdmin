import * as React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  createCategory,
  syncCategoryResourceLinks,
  updateCategory,
} from "@/lib/categories/actions";
import { createResource } from "@/lib/resources/actions";
import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  OrderedTogglePicker,
  type OrderedToggleSelection,
} from "@/components/ordered-toggle-picker";
import { CATEGORY_ICON_KEYS, slugify } from "@/lib/categories/constants";
import { categoryIcon } from "@/lib/categories/icons";
import type { Category } from "@/lib/categories/types";
import { listCategoryResourceIds, listResourcesForCategorySelect } from "@/lib/resources/queries";
import { RESOURCE_TYPE_LABELS } from "@/lib/resources/constants";
import {
  RESOURCE_TYPES,
  type ProviderOption,
  type ResourceOption,
  type ResourceType,
} from "@/lib/resources/types";
import { cn } from "@/lib/utils";

type FieldErrors = {
  title?: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  newResourceProvider?: string;
  newResourceTitle?: string;
  newResourceDescription?: string;
  newResourceType?: string;
  newResourceThumbnail?: string;
};

type CategoryFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  category: Category | null;
  resources: ResourceOption[];
  providers: ProviderOption[];
};

export function CategoryFormSheet({
  open,
  onOpenChange,
  onSaved,
  category,
  resources,
  providers,
}: CategoryFormSheetProps) {
  const isEdit = Boolean(category);
  const [pending, setPending] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [subtitle, setSubtitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [iconKey, setIconKey] = React.useState<string>("folder");
  const [isActive, setIsActive] = React.useState(true);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [availableResources, setAvailableResources] = React.useState(resources);
  const [resourceLinks, setResourceLinks] = React.useState<
    OrderedToggleSelection[]
  >([]);
  const [resourceMode, setResourceMode] = React.useState<"existing" | "new">(
    "existing",
  );
  const [creatingResource, setCreatingResource] = React.useState(false);
  const [newResourceProviderId, setNewResourceProviderId] = React.useState("");
  const [newResourceTitle, setNewResourceTitle] = React.useState("");
  const [newResourceDescription, setNewResourceDescription] = React.useState("");
  const [newResourceType, setNewResourceType] =
    React.useState<ResourceType | null>(null);
  const [newResourceWebsiteUrl, setNewResourceWebsiteUrl] = React.useState("");
  const [newResourcePhone, setNewResourcePhone] = React.useState("");
  const [newResourceVideoUrl, setNewResourceVideoUrl] = React.useState("");
  const [newResourceThumbnailUrl, setNewResourceThumbnailUrl] =
    React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});

  React.useEffect(() => {
    if (!open) return;
    setTitle(category?.title ?? "");
    setSlug(category?.slug ?? "");
    setSlugTouched(Boolean(category));
    setSubtitle(category?.subtitle ?? "");
    setDescription(category?.description ?? "");
    setIconKey(category?.icon_key ?? "folder");
    setIsActive(category?.is_active ?? true);
    setStep(1);
    setAvailableResources(resources);
    setResourceLinks([]);
    setResourceMode("existing");
    setCreatingResource(false);
    setNewResourceProviderId("");
    setNewResourceTitle("");
    setNewResourceDescription("");
    setNewResourceType(null);
    setNewResourceWebsiteUrl("");
    setNewResourcePhone("");
    setNewResourceVideoUrl("");
    setNewResourceThumbnailUrl("");
    setErrors({});
  }, [open, category, resources]);

  React.useEffect(() => {
    if (!open || !category) return;

    let cancelled = false;
    void listCategoryResourceIds(category.id)
      .then((ids) => {
        if (!cancelled) {
          setResourceLinks(
            ids.map((id, sort_order) => ({ id, sort_order })),
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error("Could not load linked resources", {
            description:
              error instanceof Error ? error.message : "Please try again.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, category]);

  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function onTitleChange(value: string) {
    setTitle(value);
    clearError("title");
    if (!isEdit && !slugTouched) {
      setSlug(slugify(value));
      clearError("slug");
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saveWithoutResources =
      step === 1 &&
      ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)
        ?.name ===
        "save-without-resources";

    if (step === 1 && !saveWithoutResources) {
      continueToResources();
      return;
    }
    if (saveWithoutResources && !validateCategoryFields()) return;

    setPending(true);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("slug", slug);
    formData.set("subtitle", subtitle);
    formData.set("description", description);
    formData.set("icon_key", iconKey);
    formData.set("is_active", isActive ? "true" : "false");

    const result = isEdit
      ? await updateCategory(category!.id, formData)
      : await createCategory(formData);

    if (!result.ok) {
      toast.error(
        isEdit ? "Could not update category" : "Could not create category",
        {
          description: result.error,
        },
      );
      setPending(false);
      return;
    }

    const categoryId = isEdit ? category!.id : result.id;
    if (!categoryId) {
      toast.error("Category saved, but missing id for resource links");
      setPending(false);
      return;
    }

    if (!saveWithoutResources) {
      const linksResult = await syncCategoryResourceLinks(
        categoryId,
        [...resourceLinks]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((link) => link.id),
      );
      if (!linksResult.ok) {
        toast.error("Category saved, but resource links could not be updated", {
          description: linksResult.error,
        });
        setPending(false);
        return;
      }
    }

    toast.success(isEdit ? "Category updated" : "Category created");
    setPending(false);
    onSaved?.();
    onOpenChange(false);
  }

  function continueToResources() {
    if (validateCategoryFields()) setStep(2);
  }

  function validateCategoryFields() {
    const nextErrors: FieldErrors = {};
    if (!title.trim()) nextErrors.title = "Title is required";
    if (!slug.trim()) nextErrors.slug = "Slug is required";
    if (!subtitle.trim()) nextErrors.subtitle = "Subtitle is required";
    if (!description.trim()) nextErrors.description = "Description is required";
    if (!iconKey) nextErrors.icon = "Icon is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function createInlineResource() {
    const nextErrors: FieldErrors = {};
    if (!newResourceProviderId) {
      nextErrors.newResourceProvider = "Provider is required";
    }
    if (!newResourceTitle.trim()) nextErrors.newResourceTitle = "Title is required";
    if (!newResourceDescription.trim()) {
      nextErrors.newResourceDescription = "Description is required";
    }
    if (!newResourceType) nextErrors.newResourceType = "Type is required";
    if (!newResourceThumbnailUrl.trim()) {
      nextErrors.newResourceThumbnail = "Thumbnail URL is required";
    }
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length > 0) return;

    setCreatingResource(true);
    const formData = new FormData();
    formData.set("provider_id", newResourceProviderId);
    formData.set("title", newResourceTitle);
    formData.set("description", newResourceDescription);
    formData.set("type", newResourceType ?? "");
    formData.set("website_url", newResourceWebsiteUrl);
    formData.set("phone", newResourcePhone);
    formData.set("video_url", newResourceVideoUrl);
    formData.set("thumbnail_url", newResourceThumbnailUrl);
    formData.set("has_video_upload", "false");
    formData.set("has_thumbnail", "true");
    formData.set("is_active", "true");

    const result = await createResource(formData);
    if (!result.ok || !result.id) {
      toast.error("Could not create resource", {
        description: result.ok ? "The new resource did not return an id." : result.error,
      });
      setCreatingResource(false);
      return;
    }

    try {
      const nextResources = await listResourcesForCategorySelect();
      setAvailableResources(nextResources);
      setResourceLinks((current) =>
        current.some((link) => link.id === result.id)
          ? current
          : [...current, { id: result.id!, sort_order: current.length }],
      );
      setResourceMode("existing");
      setNewResourceProviderId("");
      setNewResourceTitle("");
      setNewResourceDescription("");
      setNewResourceType(null);
      setNewResourceWebsiteUrl("");
      setNewResourcePhone("");
      setNewResourceVideoUrl("");
      setNewResourceThumbnailUrl("");
      toast.success("Resource created and selected");
    } catch (error) {
      toast.error("Resource created, but the resource list could not refresh", {
        description: error instanceof Error ? error.message : "Please reopen the form.",
      });
    } finally {
      setCreatingResource(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl data-[side=right]:sm:max-w-lg data-[side=right]:lg:max-w-xl data-[side=right]:xl:max-w-2xl"
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
                aria-label="Back to category details"
                title="Back to category details"
              >
                <ArrowLeft />
              </Button>
            ) : null}
            <SheetTitle>
              {isEdit ? "Edit category" : "Create category"}
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
          <div className="space-y-2">
            <Label htmlFor="category-title">Title</Label>
            <Input
              id="category-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Transportation"
              aria-invalid={Boolean(errors.title) || undefined}
              className="h-9"
            />
            <FieldError message={errors.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-slug">Slug</Label>
            <Input
              id="category-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
                clearError("slug");
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
            <Label htmlFor="category-subtitle">Subtitle</Label>
            <Input
              id="category-subtitle"
              value={subtitle}
              onChange={(e) => {
                setSubtitle(e.target.value);
                clearError("subtitle");
              }}
              placeholder="Get where you need to go"
              aria-invalid={Boolean(errors.subtitle) || undefined}
              className="h-9"
            />
            <FieldError message={errors.subtitle} />
            <p className="text-muted-foreground text-xs">
              Secondary line on menus and cards.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <textarea
              id="category-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearError("description");
              }}
              placeholder="Why it's important…"
              rows={4}
              aria-invalid={Boolean(errors.description) || undefined}
              className={cn(
                "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 md:text-sm dark:bg-input/30",
              )}
            />
            <FieldError message={errors.description} />
            <p className="text-muted-foreground text-xs">
              Shown as “Why it&apos;s important.”
            </p>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_ICON_KEYS.map((key) => {
                const Icon = categoryIcon(key);
                const selected = iconKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setIconKey(key);
                      clearError("icon");
                    }}
                    className={cn(
                      "border-border flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] transition-colors",
                      selected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "text-muted-foreground hover:bg-muted/60",
                    )}
                    aria-pressed={selected}
                    title={key}
                  >
                    <Icon className="size-4" />
                    <span className="max-w-full truncate">{key}</span>
                  </button>
                );
              })}
            </div>
            <FieldError message={errors.icon} />
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
            </>
          ) : (
            <section className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Link resources to this category
                </h3>
                <p className="text-muted-foreground text-xs">
                  Optional — you can save now and link resources later.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={resourceMode === "existing" ? "default" : "outline"}
                  onClick={() => setResourceMode("existing")}
                >
                  Choose existing
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={resourceMode === "new" ? "default" : "outline"}
                  onClick={() => setResourceMode("new")}
                >
                  Create new
                </Button>
              </div>

              {resourceMode === "existing" ? (
                <OrderedTogglePicker
                  items={availableResources.map((resource) => ({
                    id: resource.id,
                    label: resource.providers?.name
                      ? `${resource.title} — ${resource.providers.name}`
                      : resource.title,
                  }))}
                  selected={resourceLinks}
                  onChange={setResourceLinks}
                  orderHeading="Resource order"
                  emptyOrderHint="Select resources above to set their order."
                  emptyItemsHint="No resources yet. Create one to link it to this category."
                />
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={newResourceProviderId || null}
                      onValueChange={(value) => {
                        if (value) {
                          setNewResourceProviderId(value);
                          clearError("newResourceProvider");
                        }
                      }}
                      items={Object.fromEntries(
                        providers.map((provider) => [provider.id, provider.name]),
                      )}
                    >
                      <SelectTrigger
                        className="h-9 w-full"
                        aria-invalid={Boolean(errors.newResourceProvider) || undefined}
                      >
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.newResourceProvider} />
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newResourceType}
                      onValueChange={(value) => {
                        if (value) {
                          setNewResourceType(value as ResourceType);
                          clearError("newResourceType");
                        }
                      }}
                      items={RESOURCE_TYPE_LABELS}
                    >
                      <SelectTrigger
                        className="h-9 w-full"
                        aria-invalid={Boolean(errors.newResourceType) || undefined}
                      >
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {RESOURCE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {RESOURCE_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.newResourceType} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-new-resource-title">Title</Label>
                    <Input
                      id="category-new-resource-title"
                      value={newResourceTitle}
                      onChange={(event) => {
                        setNewResourceTitle(event.target.value);
                        clearError("newResourceTitle");
                      }}
                      placeholder="CareerOneStop Job Search"
                      aria-invalid={Boolean(errors.newResourceTitle) || undefined}
                      className="h-9"
                    />
                    <FieldError message={errors.newResourceTitle} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-new-resource-description">
                      Description
                    </Label>
                    <textarea
                      id="category-new-resource-description"
                      value={newResourceDescription}
                      onChange={(event) => {
                        setNewResourceDescription(event.target.value);
                        clearError("newResourceDescription");
                      }}
                      rows={3}
                      placeholder="Explore careers, find training, and search for jobs."
                      aria-invalid={
                        Boolean(errors.newResourceDescription) || undefined
                      }
                      className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-y rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30"
                    />
                    <FieldError message={errors.newResourceDescription} />
                  </div>

                  {newResourceType === "website" ? (
                    <div className="space-y-2">
                      <Label htmlFor="category-new-resource-website">
                        Website URL
                      </Label>
                      <Input
                        id="category-new-resource-website"
                        type="url"
                        value={newResourceWebsiteUrl}
                        onChange={(event) =>
                          setNewResourceWebsiteUrl(event.target.value)
                        }
                        placeholder="https://…"
                        className="h-9"
                      />
                    </div>
                  ) : null}

                  {newResourceType === "hotline" ? (
                    <div className="space-y-2">
                      <Label htmlFor="category-new-resource-phone">Phone</Label>
                      <Input
                        id="category-new-resource-phone"
                        inputMode="numeric"
                        value={newResourcePhone}
                        onChange={(event) =>
                          setNewResourcePhone(event.target.value.replace(/\D/g, ""))
                        }
                        placeholder="18005550100"
                        className="h-9"
                      />
                    </div>
                  ) : null}

                  {newResourceType === "video" ? (
                    <div className="space-y-2">
                      <Label htmlFor="category-new-resource-video">Video URL</Label>
                      <Input
                        id="category-new-resource-video"
                        type="url"
                        value={newResourceVideoUrl}
                        onChange={(event) => setNewResourceVideoUrl(event.target.value)}
                        placeholder="https://…"
                        className="h-9"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="category-new-resource-thumbnail">
                      Thumbnail URL
                    </Label>
                    <Input
                      id="category-new-resource-thumbnail"
                      type="url"
                      value={newResourceThumbnailUrl}
                      onChange={(event) => {
                        setNewResourceThumbnailUrl(event.target.value);
                        clearError("newResourceThumbnail");
                      }}
                      placeholder="https://…"
                      aria-invalid={
                        Boolean(errors.newResourceThumbnail) || undefined
                      }
                      className="h-9"
                    />
                    <FieldError message={errors.newResourceThumbnail} />
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={createInlineResource}
                    disabled={creatingResource}
                  >
                    {creatingResource ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Creating…
                      </>
                    ) : (
                      "Create resource"
                    )}
                  </Button>
                </div>
              )}
            </section>
          )}

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
                  type="submit"
                  name="save-without-resources"
                  variant="outline"
                  disabled={pending}
                >
                  {isEdit ? "Save changes" : "Save category"}
                </Button>
                <Button
                  type="button"
                  onClick={continueToResources}
                  disabled={pending}
                >
                  Continue to resources
                </Button>
              </>
            ) : (
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
            )}
          </SheetFooter>
        </form>
      </SheetContent>

    </Sheet>
  );
}
