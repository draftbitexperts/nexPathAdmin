import * as React from "react"
import { Link, useNavigate } from "react-router"
import { MonitorSmartphone, Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ANALYTICS_TAB_LABELS,
  EVENT_KIND_LABELS,
  KNOWN_EVENT_NAMES,
  SCREEN_LABELS,
  SCREEN_OPTIONS,
  SCREEN_VIEWED_EVENT,
} from "@/lib/analytics/constants"
import {
  formatEventTitle,
  formatOccurredAt,
  formatRelativeTime,
  formatScreenLabel,
  getEventScreen,
  getEventTarget,
  humanizeSnake,
  shortId,
} from "@/lib/analytics/format"
import { getTargetLabel } from "@/lib/analytics/queries"
import {
  ANALYTICS_TABS,
  EVENT_KINDS,
  type AnalyticsEvent,
  type AnalyticsEventProfile,
  type AnalyticsTab,
  type EventKind,
  type TimelineEvent,
  type UserDevice,
  type UserProfileSummary,
} from "@/lib/analytics/types"
import { cn } from "@/lib/utils"

const ALL = "__all__"

type AnalyticsManagerProps = {
  tab: AnalyticsTab
  events: AnalyticsEvent[]
  total: number
  page: number
  pageSize: number
  eventName: string | null
  screen: string | null
  kind: EventKind
  from: string | null
  to: string | null
  filterUserId: string | null
  userId: string | null
  profile: UserProfileSummary | null
  devices: UserDevice[]
  timeline: TimelineEvent[]
  targetLabels?: Record<string, string>
  eventsLoading?: boolean
  userLoading?: boolean
  userError?: string | null
}

function analyticsHref(opts: {
  tab?: AnalyticsTab
  page?: number
  eventName?: string | null
  screen?: string | null
  kind?: EventKind
  from?: string | null
  to?: string | null
  filterUserId?: string | null
  userId?: string | null
}) {
  const params = new URLSearchParams()
  const tab = opts.tab ?? "events"

  if (tab !== "events") params.set("tab", tab)
  if (opts.page && opts.page > 1) params.set("page", String(opts.page))
  if (opts.eventName?.trim()) params.set("event", opts.eventName.trim())
  if (opts.screen?.trim()) params.set("screen", opts.screen.trim())
  if (opts.kind && opts.kind !== "all") params.set("kind", opts.kind)
  if (opts.from?.trim()) params.set("from", opts.from.trim())
  if (opts.to?.trim()) params.set("to", opts.to.trim())
  if (opts.filterUserId?.trim()) params.set("user", opts.filterUserId.trim())
  if (opts.userId?.trim()) params.set("userId", opts.userId.trim())

  const qs = params.toString()
  return qs ? `?${qs}` : "?"
}

function profileSummary(
  profiles: AnalyticsEvent["profiles"]
): AnalyticsEventProfile | null {
  if (!profiles) return null
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles
}

function TablePagination({
  page,
  pageSize,
  total,
  hrefForPage,
}: {
  page: number
  pageSize: number
  total: number
  hrefForPage: (page: number) => string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
      <p className="text-muted-foreground text-sm">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={page > 1 ? hrefForPage(page - 1) : undefined}
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href={hrefForPage(pageNum)}
                  isActive={pageNum === page}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              href={
                page < totalPages ? hrefForPage(page + 1) : undefined
              }
              aria-disabled={page >= totalPages}
              className={
                page >= totalPages ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function TargetChip({
  properties,
  targetLabels,
}: {
  properties: AnalyticsEvent["properties"]
  targetLabels?: Record<string, string>
}) {
  const target = getEventTarget(properties)
  if (!target) return null

  const resolved = getTargetLabel(target.type, target.id, targetLabels)
  const label = resolved ?? shortId(target.id, 6)

  return (
    <Badge variant="outline" className="max-w-64 font-normal">
      <span className="text-muted-foreground shrink-0">
        {humanizeSnake(target.type)}
      </span>
      <span
        className={cn(
          "ml-1 truncate",
          resolved ? "font-medium" : "font-mono text-[10px]"
        )}
        title={resolved ?? target.id}
      >
        {label}
      </span>
    </Badge>
  )
}

function EventTimeline({
  events,
  targetLabels,
}: {
  events: TimelineEvent[]
  targetLabels?: Record<string, string>
}) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No events for this user yet.
      </p>
    )
  }

  return (
    <ol className="relative space-y-0 border-l border-border/70 ml-3">
      {events.map((event) => {
        const isView = event.event_name === SCREEN_VIEWED_EVENT
        return (
          <li key={event.id} className="relative pb-6 pl-6 last:pb-0">
            <span
              className={cn(
                "absolute top-1.5 -left-[5px] size-2.5 rounded-full ring-4 ring-background",
                isView ? "bg-sky-500" : "bg-emerald-500"
              )}
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">
                  {formatEventTitle(event.event_name, event.properties)}
                </p>
                <TargetChip
                  properties={event.properties}
                  targetLabels={targetLabels}
                />
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <time dateTime={event.occurred_at}>
                  {formatOccurredAt(event.occurred_at)}
                </time>
                <span aria-hidden>·</span>
                <span>{formatRelativeTime(event.occurred_at)}</span>
                {!isView && getEventScreen(event.properties) ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      on {formatScreenLabel(getEventScreen(event.properties))}
                    </span>
                  </>
                ) : null}
              </div>
              {!isView ? (
                <p className="text-muted-foreground font-mono text-[11px]">
                  {event.event_name}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function AnalyticsManager({
  tab,
  events,
  total,
  page,
  pageSize,
  eventName,
  screen,
  kind,
  from,
  to,
  filterUserId,
  userId,
  profile,
  devices,
  timeline,
  targetLabels,
  eventsLoading,
  userLoading,
  userError,
}: AnalyticsManagerProps) {
  const navigate = useNavigate()

  const [draftEventName, setDraftEventName] = React.useState(eventName ?? "")
  const [draftFrom, setDraftFrom] = React.useState(from ?? "")
  const [draftTo, setDraftTo] = React.useState(to ?? "")
  const [draftFilterUserId, setDraftFilterUserId] = React.useState(
    filterUserId ?? ""
  )
  const [draftUserId, setDraftUserId] = React.useState(userId ?? "")

  React.useEffect(() => {
    setDraftEventName(eventName ?? "")
    setDraftFrom(from ?? "")
    setDraftTo(to ?? "")
    setDraftFilterUserId(filterUserId ?? "")
  }, [eventName, from, to, filterUserId])

  React.useEffect(() => {
    setDraftUserId(userId ?? "")
  }, [userId])

  const eventSelectItems = {
    [ALL]: "Any event name",
    ...Object.fromEntries(
      KNOWN_EVENT_NAMES.map((name) => [name, humanizeSnake(name)])
    ),
  }

  const screenSelectItems = {
    [ALL]: "Any screen",
    ...Object.fromEntries(
      SCREEN_OPTIONS.map((id) => [id, SCREEN_LABELS[id] ?? id])
    ),
  }

  const kindSelectItems = Object.fromEntries(
    EVENT_KINDS.map((value) => [value, EVENT_KIND_LABELS[value]])
  )

  function eventsHref(overrides: {
    page?: number
    eventName?: string | null
    screen?: string | null
    kind?: EventKind
    from?: string | null
    to?: string | null
    filterUserId?: string | null
  }) {
    return analyticsHref({
      tab: "events",
      page: overrides.page ?? 1,
      eventName:
        overrides.eventName !== undefined ? overrides.eventName : eventName,
      screen: overrides.screen !== undefined ? overrides.screen : screen,
      kind: overrides.kind !== undefined ? overrides.kind : kind,
      from: overrides.from !== undefined ? overrides.from : from,
      to: overrides.to !== undefined ? overrides.to : to,
      filterUserId:
        overrides.filterUserId !== undefined
          ? overrides.filterUserId
          : filterUserId,
      userId,
    })
  }

  function onTabChange(value: string | number | null) {
    const next = ANALYTICS_TABS.includes(value as AnalyticsTab)
      ? (value as AnalyticsTab)
      : "events"
    navigate(
      analyticsHref({
        tab: next,
        page,
        eventName,
        screen,
        kind,
        from,
        to,
        filterUserId,
        userId,
      })
    )
  }

  function applyEventFilters(e?: React.FormEvent) {
    e?.preventDefault()
    navigate(
      eventsHref({
        page: 1,
        eventName: draftEventName.trim() || null,
        from: draftFrom.trim() || null,
        to: draftTo.trim() || null,
        filterUserId: draftFilterUserId.trim() || null,
      })
    )
  }

  function clearEventFilters() {
    setDraftEventName("")
    setDraftFrom("")
    setDraftTo("")
    setDraftFilterUserId("")
    navigate(
      analyticsHref({
        tab: "events",
        userId,
      })
    )
  }

  function openUserTimeline(id: string) {
    navigate(
      analyticsHref({
        tab: "users",
        page,
        eventName,
        screen,
        kind,
        from,
        to,
        filterUserId,
        userId: id,
      })
    )
  }

  function applyUserId(e?: React.FormEvent) {
    e?.preventDefault()
    const next = draftUserId.trim()
    navigate(
      analyticsHref({
        tab: "users",
        page,
        eventName,
        screen,
        kind,
        from,
        to,
        filterUserId,
        userId: next || null,
      })
    )
  }

  const hasEventFilters = Boolean(
    eventName || screen || kind !== "all" || from || to || filterUserId
  )

  return (
    <Tabs value={tab} onValueChange={onTabChange}>
      <TabsList>
        {ANALYTICS_TABS.map((t) => (
          <TabsTrigger key={t} value={t}>
            {ANALYTICS_TAB_LABELS[t]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="events" className="mt-4 space-y-4">
        <form
          onSubmit={applyEventFilters}
          className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5"
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-medium">
                  Kind
                </label>
                <Select
                  value={kind}
                  onValueChange={(value) => {
                    if (!value) return
                    navigate(
                      eventsHref({
                        page: 1,
                        kind: EVENT_KINDS.includes(value as EventKind)
                          ? (value as EventKind)
                          : "all",
                      })
                    )
                  }}
                  items={kindSelectItems}
                >
                  <SelectTrigger className="bg-background h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_KINDS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {EVENT_KIND_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-medium">
                  Event name
                </label>
                <Select
                  value={eventName ?? ALL}
                  onValueChange={(value) => {
                    if (!value) return
                    const next = value === ALL ? null : value
                    setDraftEventName(next ?? "")
                    navigate(eventsHref({ page: 1, eventName: next }))
                  }}
                  items={eventSelectItems}
                >
                  <SelectTrigger className="bg-background h-9 w-full">
                    <SelectValue placeholder="Any event name" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Any event name</SelectItem>
                    {KNOWN_EVENT_NAMES.map((name) => (
                      <SelectItem key={name} value={name}>
                        {humanizeSnake(name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <label className="text-muted-foreground text-xs font-medium">
                  Screen
                </label>
                <Select
                  value={screen ?? ALL}
                  onValueChange={(value) => {
                    if (!value) return
                    navigate(
                      eventsHref({
                        page: 1,
                        screen: value === ALL ? null : value,
                      })
                    )
                  }}
                  items={screenSelectItems}
                >
                  <SelectTrigger className="bg-background h-9 w-full">
                    <SelectValue placeholder="Any screen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Any screen</SelectItem>
                    {SCREEN_OPTIONS.map((id) => (
                      <SelectItem key={id} value={id}>
                        {SCREEN_LABELS[id]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-medium">
                  From
                </label>
                <Input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="bg-background h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-medium">
                  To
                </label>
                <Input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="bg-background h-9"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-muted-foreground text-xs font-medium">
                  User ID
                </label>
                <Input
                  value={draftFilterUserId}
                  onChange={(e) => setDraftFilterUserId(e.target.value)}
                  placeholder="Filter by user UUID…"
                  className="bg-background h-9 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                {eventsLoading
                  ? "Loading events…"
                  : `${total} event${total === 1 ? "" : "s"}${
                      hasEventFilters ? " matching filters" : ""
                    }`}
              </p>
              <div className="flex gap-2">
                {hasEventFilters ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearEventFilters}
                    disabled={eventsLoading}
                  >
                    <X />
                    Clear
                  </Button>
                ) : null}
                <Button type="submit" size="sm" disabled={eventsLoading}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </form>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">When</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="hidden md:table-cell">Screen</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="hidden lg:table-cell pr-6">
                  Profile
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`events-skeleton-${i}`}>
                    <TableCell className="pl-6">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden pr-6 lg:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-12 text-center"
                  >
                    No events match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => {
                  const profileRow = profileSummary(event.profiles)
                  const eventScreen = getEventScreen(event.properties)
                  return (
                    <TableRow key={event.id} className="hover:bg-muted/40">
                      <TableCell className="pl-6 align-top">
                        <div className="space-y-0.5">
                          <p className="text-sm whitespace-nowrap">
                            {formatOccurredAt(event.occurred_at)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatRelativeTime(event.occurred_at)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1.5">
                          <p className="font-medium">
                            {formatEventTitle(
                              event.event_name,
                              event.properties
                            )}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
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
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden align-top md:table-cell">
                        {eventScreen ? formatScreenLabel(eventScreen) : "—"}
                      </TableCell>
                      <TableCell className="align-top">
                        <button
                          type="button"
                          onClick={() => openUserTimeline(event.user_id)}
                          className="text-left hover:underline"
                        >
                          <span className="block font-mono text-xs">
                            {shortId(event.user_id, 10)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            View timeline
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="hidden align-top pr-6 lg:table-cell">
                        {profileRow ? (
                          <div className="text-muted-foreground space-y-0.5 text-xs">
                            <p>
                              {profileRow.state_code ?? "No state"}
                              {profileRow.area_id
                                ? ` · area ${shortId(profileRow.area_id, 6)}`
                                : ""}
                            </p>
                            <p>
                              {profileRow.onboarding_completed_at
                                ? "Onboarded"
                                : "Onboarding incomplete"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {!eventsLoading ? (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            hrefForPage={(pageNum) => eventsHref({ page: pageNum })}
          />
        ) : null}
      </TabsContent>

      <TabsContent value="users" className="mt-4 space-y-4">
        <form
          onSubmit={applyUserId}
          className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <label
              htmlFor="analytics-user-id"
              className="text-muted-foreground text-xs font-medium"
            >
              User ID
            </label>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                id="analytics-user-id"
                value={draftUserId}
                onChange={(e) => setDraftUserId(e.target.value)}
                placeholder="Paste a profiles.id UUID…"
                className="bg-background pl-8 font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Open timeline
            </Button>
            {userId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setDraftUserId("")
                  navigate(
                    analyticsHref({
                      tab: "users",
                      page,
                      eventName,
                      screen,
                      kind,
                      from,
                      to,
                      filterUserId,
                      userId: null,
                    })
                  )
                }}
              >
                <X />
                Clear
              </Button>
            ) : null}
          </div>
        </form>

        {!userId ? (
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>User activity</CardTitle>
              <CardDescription>
                Paste a user ID to inspect their ordered event timeline and
                devices. From the Events tab, click a user to jump here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : userError ? (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
          >
            Could not load user activity: {userError}
          </div>
        ) : userLoading ? (
          <div className="grid gap-4 xl:grid-cols-5">
            <div className="space-y-4 xl:col-span-2">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </CardContent>
              </Card>
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-56" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </CardContent>
              </Card>
            </div>
            <Card className="border-border/60 shadow-sm xl:col-span-3">
              <CardHeader>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 pl-3">
                    <Skeleton className="mt-1 size-2.5 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-5">
            <div className="space-y-4 xl:col-span-2">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription className="font-mono text-xs break-all">
                    {userId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {profile ? (
                    <>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">State</span>
                        <span>{profile.state_code ?? "—"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Area</span>
                        <span className="font-mono text-xs">
                          {profile.area_id
                            ? shortId(profile.area_id, 10)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          Onboarding
                        </span>
                        <span>
                          {profile.onboarding_completed_at
                            ? formatOccurredAt(profile.onboarding_completed_at)
                            : "Incomplete"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No profile row found for this ID.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    nativeButton={false}
                    render={
                      <Link
                        to={analyticsHref({
                          tab: "events",
                          page: 1,
                          eventName,
                          screen,
                          kind,
                          from,
                          to,
                          filterUserId: userId,
                          userId,
                        })}
                      />
                    }
                  >
                    Filter events for this user
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MonitorSmartphone className="size-4" />
                    Devices
                  </CardTitle>
                  <CardDescription>
                    Loaded from user_devices — not attached to individual
                    events.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {devices.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No devices registered for this user.
                    </p>
                  ) : (
                    devices.map((device) => (
                      <div
                        key={device.id}
                        className="border-border/60 rounded-lg border px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">
                            {device.platform ?? "Unknown platform"}
                            {device.model ? ` · ${device.model}` : ""}
                          </p>
                          {device.app_version ? (
                            <Badge variant="secondary" className="font-normal">
                              v{device.app_version}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          OS {device.os_version ?? "—"}
                          {device.last_seen_at
                            ? ` · last seen ${formatRelativeTime(device.last_seen_at)}`
                            : ""}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60 shadow-sm xl:col-span-3">
              <CardHeader>
                <CardTitle>Activity timeline</CardTitle>
                <CardDescription>
                  Latest {timeline.length} event
                  {timeline.length === 1 ? "" : "s"}, newest first.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventTimeline
                  events={timeline}
                  targetLabels={targetLabels}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
