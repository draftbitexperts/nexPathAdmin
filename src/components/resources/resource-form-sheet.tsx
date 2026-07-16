"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  createResource,
  syncResourceCategoryLinks,
  updateResource,
} from "@/app/dashboard/resources/actions";
import { FieldError } from "@/components/field-error";
import {
  OrderedTogglePicker,
  type OrderedToggleSelection,
} from "@/components/ordered-toggle-picker";
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
import { CATEGORY_ICON_KEYS } from "@/lib/categories/constants";
import { categoryIcon } from "@/lib/categories/icons";
import { RESOURCE_TYPE_LABELS } from "@/lib/resources/constants";
import {
  RESOURCE_TYPES,
  type CategoryLinkInput,
  type CategoryOption,
  type ProviderOption,
  type ResourceType,
  type ResourceWithRelations,
} from "@/lib/resources/types";
import { cn } from "@/lib/utils";

type CategoryLinkDraft = {
  category_id: string;
  enabled: boolean;
  sort_order: number;
};

function linksFromResource(
  resource: ResourceWithRelations | null,
  categories: CategoryOption[],
): CategoryLinkDraft[] {
  const linked = new Map(
    (resource?.category_resources ?? []).map((link) => [
      link.category_id,
      link.sort_order,
    ]),
  );

  return categories.map((category) => ({
    category_id: category.id,
    enabled: linked.has(category.id),
    sort_order: linked.get(category.id) ?? 0,
  }));
}

type FieldErrors = {
  providerId?: string;
  title?: string;
  type?: string;
  url?: string;
  phone?: string;
  videoId?: string;
  body?: string;
};

function validateResourceFields(fields: {
  providerId: string;
  title: string;
  type: ResourceType | null;
  url: string;
  phone: string;
  videoId: string;
  body: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.providerId) errors.providerId = "Provider is required";
  if (!fields.title.trim()) errors.title = "Title is required";
  if (!fields.type) {
    errors.type = "Type is required";
    return errors;
  }

  if (fields.type === "website" && !fields.url.trim()) {
    errors.url = "URL is required";
  }
  if (fields.type === "hotline" && !fields.phone.trim()) {
    errors.phone = "Phone is required";
  }
  if (fields.type === "youtube") {
    if (!fields.url.trim() && !fields.videoId.trim()) {
      errors.url = "URL or video ID is required";
      errors.videoId = "URL or video ID is required";
    }
  }
  if (fields.type === "text" && !fields.body.trim()) {
    errors.body = "Body is required";
  }

  return errors;
}

type ResourceFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: ResourceWithRelations | null;
  providers: ProviderOption[];
  categories: CategoryOption[];
};

export function ResourceFormSheet({
  open,
  onOpenChange,
  resource,
  providers,
  categories,
}: ResourceFormSheetProps) {
  const isEdit = Boolean(resource);
  const [pending, setPending] = React.useState(false);
  const [providerId, setProviderId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [carouselLabel, setCarouselLabel] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [type, setType] = React.useState<ResourceType | null>(null);
  const [url, setUrl] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [videoId, setVideoId] = React.useState("");
  const [body, setBody] = React.useState("");
  const [iconKey, setIconKey] = React.useState("");
  const [heroImageUrl, setHeroImageUrl] = React.useState("");
  const [isActive, setIsActive] = React.useState(false);
  const [links, setLinks] = React.useState<CategoryLinkDraft[]>([]);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  React.useEffect(() => {
    if (!open) return;
    setProviderId(resource?.provider_id ?? "");
    setTitle(resource?.title ?? "");
    setCarouselLabel(resource?.carousel_label ?? "");
    setSummary(resource?.summary ?? "");
    setType(resource?.type ?? null);
    setUrl(resource?.url ?? "");
    setPhone(resource?.phone ?? "");
    setVideoId(resource?.video_id ?? "");
    setBody(resource?.body ?? "");
    setIconKey(resource?.icon_key ?? "");
    setHeroImageUrl(resource?.hero_image_url ?? "");
    setIsActive(resource?.is_active ?? false);
    setLinks(linksFromResource(resource, categories));
    setErrors({});
  }, [open, resource, categories]);

  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function toCategoryLinkInputs(): CategoryLinkInput[] {
    return links
      .filter((link) => link.enabled)
      .map((link) => ({
        category_id: link.category_id,
        sort_order: link.sort_order,
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function categorySelection(): OrderedToggleSelection[] {
    return links
      .filter((link) => link.enabled)
      .map((link) => ({
        id: link.category_id,
        sort_order: link.sort_order,
      }));
  }

  function onCategoriesChange(next: OrderedToggleSelection[]) {
    const selected = new Map(next.map((item) => [item.id, item.sort_order]));
    setLinks((prev) =>
      prev.map((link) => {
        const sortOrder = selected.get(link.category_id);
        if (sortOrder === undefined) {
          return { ...link, enabled: false, sort_order: 0 };
        }
        return { ...link, enabled: true, sort_order: sortOrder };
      }),
    );
  }

  function onTypeChange(value: string | null) {
    if (!value) return;
    const next = value as ResourceType;
    setType(next);
    clearError("type");
    clearError("url");
    clearError("phone");
    clearError("videoId");
    clearError("body");
    // Clear payload fields that do not apply to the selected type.
    if (next !== "website" && next !== "youtube") setUrl("");
    if (next !== "hotline") setPhone("");
    if (next !== "youtube") setVideoId("");
    if (next !== "text") setBody("");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateResourceFields({
      providerId,
      title,
      type,
      url,
      phone,
      videoId,
      body,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);

    const formData = new FormData();
    formData.set("provider_id", providerId);
    formData.set("title", title);
    formData.set("carousel_label", carouselLabel);
    formData.set("summary", summary);
    formData.set("type", type!);
    formData.set("url", url);
    formData.set("phone", phone);
    formData.set("video_id", videoId);
    formData.set("body", body);
    formData.set("icon_key", iconKey);
    formData.set("hero_image_url", heroImageUrl);
    formData.set("is_active", isActive ? "true" : "false");

    const result = isEdit
      ? await updateResource(resource!.id, formData)
      : await createResource(formData);

    if (!result.ok) {
      toast.error(
        isEdit ? "Could not update resource" : "Could not create resource",
        { description: result.error },
      );
      setPending(false);
      return;
    }

    const resourceId = isEdit ? resource!.id : result.id;
    if (resourceId) {
      const linksResult = await syncResourceCategoryLinks(
        resourceId,
        toCategoryLinkInputs(),
      );
      if (!linksResult.ok) {
        toast.error("Resource saved, but category links failed", {
          description: linksResult.error,
        });
        setPending(false);
        return;
      }
    }

    toast.success(isEdit ? "Resource updated" : "Resource created");
    setPending(false);
    onOpenChange(false);
  }

  const textareaClassName = cn(
    "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 md:text-sm dark:bg-input/30",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  );

  const canSubmit = !pending && providers.length > 0 && Boolean(providerId);

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
                  setProviderId(value);
                  clearError("providerId");
                }
              }}
              items={Object.fromEntries(
                providers.map((provider) => [provider.id, provider.name]),
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
                setTitle(e.target.value);
                clearError("title");
              }}
              placeholder="CareerOneStop Job Search"
              aria-invalid={Boolean(errors.title) || undefined}
              className="h-9"
            />
            <FieldError message={errors.title} />
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
                  setUrl(e.target.value);
                  clearError("url");
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
                    setUrl(e.target.value);
                    clearError("url");
                    clearError("videoId");
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
                    setVideoId(e.target.value);
                    clearError("videoId");
                    clearError("url");
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
                  setPhone(e.target.value);
                  clearError("phone");
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
                  setBody(e.target.value);
                  clearError("body");
                }}
                placeholder="Guidance or informational copy…"
                rows={5}
                aria-invalid={Boolean(errors.body) || undefined}
                className={textareaClassName}
              />
              <FieldError message={errors.body} />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="resource-hero">Hero image URL</Label>
            <Input
              id="resource-hero"
              type="url"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://…"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setIconKey("")}
                className={cn(
                  "border-border flex flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[10px] transition-colors",
                  iconKey === ""
                    ? "border-primary bg-primary/5 text-foreground"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
                aria-pressed={iconKey === ""}
              >
                None
              </button>
              {CATEGORY_ICON_KEYS.map((key) => {
                const Icon = categoryIcon(key);
                const selected = iconKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIconKey(key)}
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
            <p className="text-sm font-medium">Categories</p>
            <OrderedTogglePicker
              items={categories.map((category) => ({
                id: category.id,
                label: category.name,
              }))}
              selected={categorySelection()}
              onChange={onCategoriesChange}
              orderHeading="Carousel order"
              emptyOrderHint="Select categories above to set carousel order."
              emptyItemsHint="No active categories yet."
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
  );
}
