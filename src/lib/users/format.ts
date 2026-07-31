import type { UserProfileDemographics } from "@/lib/users/types";

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Not completed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

export function formatBirthDate(month: unknown, year: unknown): string {
  const monthNumber = typeof month === "number" ? month : Number(month);
  const yearNumber = typeof year === "number" ? year : Number(year);

  if (
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12 ||
    !Number.isInteger(yearNumber) ||
    yearNumber < 1
  ) {
    return "—";
  }

  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(yearNumber, monthNumber - 1, 1)));

  return `${monthName} ${yearNumber}`;
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (absMs < 30 * day) return rtf.format(Math.round(diffMs / day), "day");
  return formatDateTime(value);
}

export function humanizeSnake(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function shortId(id: string, chars = 8): string {
  if (id.length <= chars) return id;
  return `${id.slice(0, chars)}...`;
}

export function categoryName(
  category: { title: string | null } | { title: string | null }[] | null,
): string {
  const row = Array.isArray(category) ? category[0] : category;
  return row?.title ?? "Category";
}

export function communityDurationLabel(
  user: Pick<
    UserProfileDemographics,
    "community_duration_label" | "community_duration"
  >,
): string {
  return user.community_duration_label ?? user.community_duration?.label ?? "";
}
