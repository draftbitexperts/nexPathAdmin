import * as React from "react"
import { useNavigate } from "react-router"
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteArea,
  deleteCommunityDuration,
  deleteState,
  setAreaActive,
  setCommunityDurationActive,
  setStateActive,
} from "@/lib/locations/actions"
import { AreaFormSheet } from "@/components/locations/area-form-sheet"
import { DurationFormSheet } from "@/components/locations/duration-form-sheet"
import { StateFormSheet } from "@/components/locations/state-form-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LOCATION_TAB_LABELS } from "@/lib/locations/constants"
import {
  LOCATION_TABS,
  type Area,
  type CommunityDuration,
  type LocationTab,
  type State,
  type StateOption,
} from "@/lib/locations/types"
import { cn } from "@/lib/utils"

type LocationsManagerProps = {
  tab: LocationTab
  states: State[]
  areas: Area[]
  durations: CommunityDuration[]
  stateOptions: StateOption[]
  stateCode: string | null
  search: string | null
  total: number
  page: number
  pageSize: number
  onMutated?: () => void
}

const SEARCH_PLACEHOLDERS: Record<LocationTab, string> = {
  states: "Search states…",
  areas: "Search areas…",
  durations: "Search durations…",
}

function locationsHref(
  tab: LocationTab,
  page: number,
  stateCode: string | null,
  search: string | null
) {
  const params = new URLSearchParams()
  if (tab !== "states") params.set("tab", tab)
  if (page > 1) params.set("page", String(page))
  if (tab === "areas" && stateCode) params.set("state", stateCode)
  const q = search?.trim()
  if (q) params.set("q", q)
  const qs = params.toString()
  return qs ? `?${qs}` : "?"
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium",
        active
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  )
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
              href={page < totalPages ? hrefForPage(page + 1) : undefined}
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

export function LocationsManager({
  tab,
  states,
  areas,
  durations,
  stateOptions,
  stateCode,
  search,
  total,
  page,
  pageSize,
  onMutated,
}: LocationsManagerProps) {
  const navigate = useNavigate()
  const [query, setQuery] = React.useState(search ?? "")

  const [stateSheetOpen, setStateSheetOpen] = React.useState(false)
  const [editingState, setEditingState] = React.useState<State | null>(null)
  const [deletingState, setDeletingState] = React.useState<State | null>(null)

  const [areaSheetOpen, setAreaSheetOpen] = React.useState(false)
  const [editingArea, setEditingArea] = React.useState<Area | null>(null)
  const [deletingArea, setDeletingArea] = React.useState<Area | null>(null)

  const [durationSheetOpen, setDurationSheetOpen] = React.useState(false)
  const [editingDuration, setEditingDuration] =
    React.useState<CommunityDuration | null>(null)
  const [deletingDuration, setDeletingDuration] =
    React.useState<CommunityDuration | null>(null)

  const [busyKey, setBusyKey] = React.useState<string | null>(null)

  React.useEffect(() => {
    setQuery(search ?? "")
  }, [search, tab])

  React.useEffect(() => {
    const trimmed = query.trim()
    const current = (search ?? "").trim()
    if (trimmed === current) return

    const timer = window.setTimeout(() => {
      navigate(
        locationsHref(tab, 1, tab === "areas" ? stateCode : null, trimmed || null)
      )
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, navigate, search, stateCode, tab])

  const stateSelectItems = Object.fromEntries(
    stateOptions.map((s) => [s.code, `${s.name} (${s.code})`])
  )

  function onTabChange(value: string | number | null) {
    const next = LOCATION_TABS.includes(value as LocationTab)
      ? (value as LocationTab)
      : "states"
    setQuery("")
    navigate(
      locationsHref(next, 1, next === "areas" ? stateCode : null, null)
    )
  }

  function onStateFilter(value: string | null) {
    if (!value) return
    navigate(locationsHref("areas", 1, value, search))
  }

  function clearSearch() {
    setQuery("")
    navigate(
      locationsHref(tab, 1, tab === "areas" ? stateCode : null, null)
    )
  }

  async function toggleStateActive(row: State) {
    setBusyKey(`state:${row.code}`)
    const result = await setStateActive(row.code, !row.is_active)
    if (!result.ok) {
      toast.error("Could not update status", { description: result.error })
    } else {
      toast.success(row.is_active ? "State deactivated" : "State activated")
      onMutated?.()
    }
    setBusyKey(null)
  }

  async function confirmDeleteState() {
    if (!deletingState) return
    setBusyKey(`state:${deletingState.code}`)
    const result = await deleteState(deletingState.code)
    if (!result.ok) {
      toast.error("Could not delete state", { description: result.error })
    } else {
      toast.success("State deleted")
      setDeletingState(null)
      onMutated?.()
    }
    setBusyKey(null)
  }

  async function toggleAreaActive(row: Area) {
    setBusyKey(`area:${row.id}`)
    const result = await setAreaActive(row.id, !row.is_active)
    if (!result.ok) {
      toast.error("Could not update status", { description: result.error })
    } else {
      toast.success(row.is_active ? "Area deactivated" : "Area activated")
      onMutated?.()
    }
    setBusyKey(null)
  }

  async function confirmDeleteArea() {
    if (!deletingArea) return
    setBusyKey(`area:${deletingArea.id}`)
    const result = await deleteArea(deletingArea.id)
    if (!result.ok) {
      toast.error("Could not delete area", { description: result.error })
    } else {
      toast.success("Area deleted")
      setDeletingArea(null)
      onMutated?.()
    }
    setBusyKey(null)
  }

  async function toggleDurationActive(row: CommunityDuration) {
    setBusyKey(`duration:${row.id}`)
    const result = await setCommunityDurationActive(row.id, !row.is_active)
    if (!result.ok) {
      toast.error("Could not update status", { description: result.error })
    } else {
      toast.success(
        row.is_active ? "Duration deactivated" : "Duration activated"
      )
      onMutated?.()
    }
    setBusyKey(null)
  }

  async function confirmDeleteDuration() {
    if (!deletingDuration) return
    setBusyKey(`duration:${deletingDuration.id}`)
    const result = await deleteCommunityDuration(deletingDuration.id)
    if (!result.ok) {
      toast.error("Could not delete duration", { description: result.error })
    } else {
      toast.success("Duration deleted")
      setDeletingDuration(null)
      onMutated?.()
    }
    setBusyKey(null)
  }

  return (
    <>
      <Tabs value={tab} onValueChange={onTabChange}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            {LOCATION_TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {LOCATION_TAB_LABELS[t]}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={SEARCH_PLACEHOLDERS[tab]}
              className="h-8 pr-8 pl-8"
              aria-label={SEARCH_PLACEHOLDERS[tab]}
            />
            {query ? (
              <button
                type="button"
                onClick={clearSearch}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <TabsContent value="states" className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-3">
              <p className="text-muted-foreground text-sm">
                {total} state{total === 1 ? "" : "s"}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingState(null)
                  setStateSheetOpen(true)
                }}
              >
                <Plus />
                Create state
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">State</TableHead>
                  <TableHead className="hidden sm:table-cell">Local areas</TableHead>
                  <TableHead className="hidden md:table-cell">Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {states.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-12 text-center"
                    >
                      {search
                        ? `No states match “${search}”.`
                        : "No states yet. Add the first state for onboarding dropdowns."}
                    </TableCell>
                  </TableRow>
                ) : (
                  states.map((row) => (
                    <TableRow key={row.code} className="hover:bg-muted/40">
                      <TableCell className="pl-6">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingState(row)
                            setStateSheetOpen(true)
                          }}
                          className="text-left"
                        >
                          <span className="block font-medium">{row.name}</span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {row.code}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-medium",
                            row.has_local_areas
                              ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {row.has_local_areas ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden tabular-nums md:table-cell">
                        {row.sort_order}
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={row.is_active} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={busyKey === `state:${row.code}`}
                                aria-label={`Actions for ${row.name}`}
                              />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingState(row)
                                setStateSheetOpen(true)
                              }}
                            >
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleStateActive(row)}
                            >
                              {row.is_active ? <PowerOff /> : <Power />}
                              {row.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeletingState(row)}
                            >
                              <Trash2 />
                              Delete…
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            hrefForPage={(p) => locationsHref("states", p, null, search)}
          />
        </TabsContent>

        <TabsContent value="areas" className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <p className="text-muted-foreground text-sm">
                  {total} area{total === 1 ? "" : "s"}
                </p>
                {stateOptions.length > 0 ? (
                  <Select
                    value={stateCode ?? undefined}
                    onValueChange={onStateFilter}
                    items={stateSelectItems}
                  >
                    <SelectTrigger className="bg-background h-8 w-56 max-w-full">
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent
                      side="bottom"
                      align="start"
                      className="max-h-56"
                    >
                      {stateOptions.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.name} ({option.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
              <Button
                size="sm"
                disabled={!stateCode && stateOptions.length === 0}
                onClick={() => {
                  setEditingArea(null)
                  setAreaSheetOpen(true)
                }}
              >
                <Plus />
                Create area
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Area</TableHead>
                  <TableHead className="hidden sm:table-cell">State</TableHead>
                  <TableHead className="hidden md:table-cell">Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!stateCode ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-12 text-center"
                    >
                      {stateOptions.length === 0
                        ? "Add a state before creating areas."
                        : "Select a state to view its areas."}
                    </TableCell>
                  </TableRow>
                ) : areas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-12 text-center"
                    >
                      {search
                        ? `No areas match “${search}”.`
                        : "No areas for this state yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  areas.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      <TableCell className="pl-6">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingArea(row)
                            setAreaSheetOpen(true)
                          }}
                          className="text-left font-medium"
                        >
                          {row.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden font-mono text-xs sm:table-cell">
                        {row.state_code}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden tabular-nums md:table-cell">
                        {row.sort_order}
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={row.is_active} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={busyKey === `area:${row.id}`}
                                aria-label={`Actions for ${row.name}`}
                              />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingArea(row)
                                setAreaSheetOpen(true)
                              }}
                            >
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleAreaActive(row)}
                            >
                              {row.is_active ? <PowerOff /> : <Power />}
                              {row.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeletingArea(row)}
                            >
                              <Trash2 />
                              Delete…
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            hrefForPage={(p) => locationsHref("areas", p, stateCode, search)}
          />
        </TabsContent>

        <TabsContent value="durations" className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-3">
              <p className="text-muted-foreground text-sm">
                {total} duration{total === 1 ? "" : "s"}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setEditingDuration(null)
                  setDurationSheetOpen(true)
                }}
              >
                <Plus />
                Create duration
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Label</TableHead>
                  <TableHead className="hidden sm:table-cell">Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {durations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground py-12 text-center"
                    >
                      {search
                        ? `No durations match “${search}”.`
                        : "No community durations yet. Add options for the onboarding demographic dropdown."}
                    </TableCell>
                  </TableRow>
                ) : (
                  durations.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      <TableCell className="pl-6">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDuration(row)
                            setDurationSheetOpen(true)
                          }}
                          className="text-left font-medium"
                        >
                          {row.label}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden tabular-nums sm:table-cell">
                        {row.sort_order}
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={row.is_active} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={busyKey === `duration:${row.id}`}
                                aria-label={`Actions for ${row.label}`}
                              />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingDuration(row)
                                setDurationSheetOpen(true)
                              }}
                            >
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleDurationActive(row)}
                            >
                              {row.is_active ? <PowerOff /> : <Power />}
                              {row.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeletingDuration(row)}
                            >
                              <Trash2 />
                              Delete…
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            hrefForPage={(p) => locationsHref("durations", p, null, search)}
          />
        </TabsContent>
      </Tabs>

      <StateFormSheet
        open={stateSheetOpen}
        onOpenChange={setStateSheetOpen}
        state={editingState}
        onSaved={onMutated}
      />
      <AreaFormSheet
        open={areaSheetOpen}
        onOpenChange={setAreaSheetOpen}
        area={editingArea}
        stateOptions={stateOptions}
        defaultStateCode={stateCode}
      />
      <DurationFormSheet
        open={durationSheetOpen}
        onOpenChange={setDurationSheetOpen}
        duration={editingDuration}
        onSaved={onMutated}
      />

      <Dialog
        open={Boolean(deletingState)}
        onOpenChange={(open) => {
          if (!open) setDeletingState(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deletingState?.name}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the state. Areas linked to it will be
              deleted too.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingState(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteState}
              disabled={busyKey === `state:${deletingState?.code}`}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingArea)}
        onOpenChange={(open) => {
          if (!open) setDeletingArea(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deletingArea?.name}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the area from onboarding dropdowns.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingArea(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteArea}
              disabled={busyKey === `area:${deletingArea?.id}`}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingDuration)}
        onOpenChange={(open) => {
          if (!open) setDeletingDuration(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deletingDuration?.label}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the community duration option.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDuration(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteDuration}
              disabled={busyKey === `duration:${deletingDuration?.id}`}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
