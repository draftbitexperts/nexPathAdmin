import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FieldError } from "@/components/field-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { saveGoalCategory } from "@/lib/goal-categories/actions";
import {
  GOAL_CATEGORY_ICON_KEYS,
  slugify,
} from "@/lib/goal-categories/constants";
import { categoryIcon } from "@/lib/categories/icons";
import type { GoalCategory } from "@/lib/goal-categories/types";
import { cn } from "@/lib/utils";

type FieldErrors = {
  title?: string;
  slug?: string;
};

type GoalCategoryFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  goalCategory: GoalCategory | null;
};

export function GoalCategoryFormSheet({
  open,
  onOpenChange,
  onSaved,
  goalCategory,
}: GoalCategoryFormSheetProps) {
  const isEdit = Boolean(goalCategory);
  const [pending, setPending] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [subtitle, setSubtitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [iconKey, setIconKey] = React.useState("folder");
  const [isActive, setIsActive] = React.useState(true);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  React.useEffect(() => {
    if (!open) return;
    setTitle(goalCategory?.title ?? "");
    setSlug(goalCategory?.slug ?? "");
    setSlugTouched(Boolean(goalCategory));
    setSubtitle(goalCategory?.subtitle ?? "");
    setDescription(goalCategory?.description ?? "");
    setIconKey(goalCategory?.icon_key ?? "folder");
    setIsActive(goalCategory?.is_active ?? true);
    setErrors({});
  }, [open, goalCategory]);

  function clearError(field: keyof FieldErrors) {
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!title.trim()) nextErrors.title = "Title is required";
    if (!slug.trim()) nextErrors.slug = "Slug is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("slug", slug);
    formData.set("subtitle", subtitle);
    formData.set("description", description);
    formData.set("icon_key", iconKey);
    formData.set("is_active", isActive ? "true" : "false");

    const result = await saveGoalCategory(goalCategory?.id ?? null, formData);
    if (!result.ok) {
      toast.error(
        isEdit
          ? "Could not update goal category"
          : "Could not create goal category",
        { description: result.error },
      );
      setPending(false);
      return;
    }

    toast.success(isEdit ? "Goal category updated" : "Goal category created");
    setPending(false);
    onSaved?.();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Edit goal category" : "Create goal category"}
          </SheetTitle>
        </SheetHeader>

        <form
          noValidate
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4"
        >
          <div className="space-y-2">
            <Label htmlFor="goal-category-title">Title</Label>
            <Input
              id="goal-category-title"
              value={title}
              onChange={(event) => {
                const value = event.target.value;
                setTitle(value);
                clearError("title");
                if (!isEdit && !slugTouched) setSlug(slugify(value));
              }}
              placeholder="Transportation"
              aria-invalid={Boolean(errors.title) || undefined}
              className="h-9"
            />
            <FieldError message={errors.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-category-slug">Slug</Label>
            <Input
              id="goal-category-slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
                clearError("slug");
              }}
              disabled={isEdit}
              placeholder="transportation"
              aria-invalid={Boolean(errors.slug) || undefined}
              className="h-9 font-mono text-xs"
            />
            <FieldError message={errors.slug} />
            {isEdit ? (
              <p className="text-muted-foreground text-xs">
                Slugs are stable after creation.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-category-subtitle">Subtitle</Label>
            <Input
              id="goal-category-subtitle"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              placeholder="Get where you need to go"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-category-description">Description</Label>
            <textarea
              id="goal-category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Why this goal is important…"
              rows={4}
              className={cn(
                "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {GOAL_CATEGORY_ICON_KEYS.map((key) => {
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
                "Create goal category"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
