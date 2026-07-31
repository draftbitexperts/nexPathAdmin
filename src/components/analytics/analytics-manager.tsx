import { X } from "lucide-react";
import { useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EVENT_KIND_LABELS,
  KNOWN_EVENT_NAMES,
  SCREEN_LABELS,
  SCREEN_OPTIONS,
} from "@/lib/analytics/constants";
import {
  formatEventTitle,
  formatOccurredAt,
  formatRelativeTime,
  formatScreenLabel,
  getEventScreen,
  getEventTarget,
  getEventTargetLabel,
  humanizeSnake,
  shortId,
} from "@/lib/analytics/format";
import {
  ANALYTICS_DATE_RANGES,
  EVENT_KINDS,
  type AnalyticsEvent,
  type AnalyticsDateRange,
  type EventKind,
} from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

const ALL = "__all__";

type Props = {
  events: AnalyticsEvent[];
  total: number;
  page: number;
  pageSize: number;
  eventName: string | null;
  screen: string | null;
  kind: EventKind;
  dateRange: AnalyticsDateRange;
  targetLabels?: Record<string, string>;
  eventsLoading?: boolean;
};

function href(options: {
  page?: number;
  eventName?: string | null;
  screen?: string | null;
  kind?: EventKind;
  dateRange?: AnalyticsDateRange;
}) {
  const params = new URLSearchParams();
  if (options.page && options.page > 1)
    params.set("page", String(options.page));
  if (options.eventName) params.set("event", options.eventName);
  if (options.screen) params.set("screen", options.screen);
  if (options.kind && options.kind !== "all") params.set("kind", options.kind);
  if (options.dateRange && options.dateRange !== "all") {
    params.set("range", options.dateRange);
  }
  return params.size ? `?${params}` : "?";
}

function PaginationControl({
  page,
  pageSize,
  total,
  getHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  getHref: (page: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  return (
    <Pagination className="mx-0 w-auto justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={page > 1 ? getHref(page - 1) : undefined}
            aria-disabled={page <= 1}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (number) => (
            <PaginationItem key={number}>
              <PaginationLink href={getHref(number)} isActive={number === page}>
                {number}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href={page < totalPages ? getHref(page + 1) : undefined}
            aria-disabled={page >= totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function TargetChip({
  properties,
  targetLabels,
}: {
  properties: AnalyticsEvent["properties"];
  targetLabels?: Record<string, string>;
}) {
  const target = getEventTarget(properties);
  if (!target) return null;
  const label = getEventTargetLabel(properties, targetLabels);
  return (
    <Badge variant="outline" className="max-w-64 font-normal">
      <span className="text-muted-foreground shrink-0">
        {humanizeSnake(target.type)}
      </span>
      <span
        className={cn(
          "ml-1 truncate",
          label ? "font-medium" : "font-mono text-[10px]",
        )}
        title={label ?? target.id}
      >
        {label ?? shortId(target.id, 6)}
      </span>
    </Badge>
  );
}

export function AnalyticsManager({
  events,
  total,
  page,
  pageSize,
  eventName,
  screen,
  kind,
  dateRange,
  targetLabels,
  eventsLoading,
}: Props) {
  const navigate = useNavigate();

  const getHref = (overrides: {
    page?: number;
    eventName?: string | null;
    screen?: string | null;
    kind?: EventKind;
    dateRange?: AnalyticsDateRange;
  }) =>
    href({
      page: overrides.page ?? 1,
      eventName:
        overrides.eventName !== undefined ? overrides.eventName : eventName,
      screen: overrides.screen !== undefined ? overrides.screen : screen,
      kind: overrides.kind !== undefined ? overrides.kind : kind,
      dateRange:
        overrides.dateRange !== undefined ? overrides.dateRange : dateRange,
    });
  const hasFilters = Boolean(
    eventName || screen || kind !== "all" || dateRange !== "all",
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="shrink-0 rounded-lg border border-border/60 bg-card p-3">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Kind"
            value={kind}
            items={Object.fromEntries(
              EVENT_KINDS.map((value) => [value, EVENT_KIND_LABELS[value]]),
            )}
            onValueChange={(value) =>
              navigate(getHref({ page: 1, kind: value as EventKind }))
            }
          />
          <FilterSelect
            label="Event name"
            className="w-60"
            value={eventName ?? ALL}
            items={{
              [ALL]: "Any event name",
              ...Object.fromEntries(
                KNOWN_EVENT_NAMES.map((name) => [name, humanizeSnake(name)]),
              ),
            }}
            onValueChange={(value) =>
              navigate(
                getHref({ page: 1, eventName: value === ALL ? null : value }),
              )
            }
          />
          <FilterSelect
            label="Screen"
            value={screen ?? ALL}
            items={{
              [ALL]: "Any screen",
              ...Object.fromEntries(
                SCREEN_OPTIONS.map((id) => [id, SCREEN_LABELS[id]]),
              ),
            }}
            onValueChange={(value) =>
              navigate(
                getHref({ page: 1, screen: value === ALL ? null : value }),
              )
            }
          />
          <FilterSelect
            label="Date range"
            value={dateRange}
            className="ml-auto"
            items={Object.fromEntries(
              ANALYTICS_DATE_RANGES.map((range) => [
                range,
                {
                  all: "All time",
                  today: "Today",
                  week: "Last 7 days",
                  month: "Last 30 days",
                }[range],
              ]),
            )}
            onValueChange={(range) =>
              navigate(
                getHref({ page: 1, dateRange: range as AnalyticsDateRange }),
              )
            }
          />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
          <p className="text-muted-foreground text-sm">
            {eventsLoading
              ? "Loading events…"
              : `${total} event${total === 1 ? "" : "s"}${hasFilters ? " matching filters" : ""}`}
          </p>
          {hasFilters && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => navigate(href({}))}
            >
              <X />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-card sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="bg-card pl-6">When</TableHead>
              <TableHead className="bg-card">Event</TableHead>
              <TableHead className="bg-card hidden pr-6 md:table-cell">
                Screen
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="pl-6">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="hidden pr-6 md:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-muted-foreground py-12 text-center"
                >
                  No events match these filters.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => {
                const eventScreen = getEventScreen(event.properties);
                return (
                  <TableRow key={event.id} className="hover:bg-muted/40">
                    <TableCell className="pl-6 align-top">
                      <p className="text-sm whitespace-nowrap">
                        {formatOccurredAt(event.occurred_at)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatRelativeTime(event.occurred_at)}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <p className="font-medium">
                        {formatEventTitle(event.event_name, event.properties)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] font-normal"
                        >
                          {event.event_name}
                        </Badge>
                        <TargetChip
                          properties={event.properties}
                          targetLabels={targetLabels}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden align-top pr-6 md:table-cell">
                      {eventScreen ? formatScreenLabel(eventScreen) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {!eventsLoading && (
        <PaginationControl
          page={page}
          pageSize={pageSize}
          total={total}
          getHref={(number) => getHref({ page: number })}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  items,
  onValueChange,
  className,
}: {
  label: string;
  value: string;
  items: Record<string, string | undefined>;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("w-40 space-y-1.5", className)}>
      <label className="text-muted-foreground text-xs font-medium">
        {label}
      </label>
      <Select
        value={value}
        onValueChange={(next) => next && onValueChange(next)}
        items={items}
      >
        <SelectTrigger className="bg-background h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(items).map(([itemValue, itemLabel]) => (
            <SelectItem key={itemValue} value={itemValue}>
              {itemLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
