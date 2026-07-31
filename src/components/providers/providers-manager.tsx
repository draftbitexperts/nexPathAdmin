import * as React from "react"
import { useNavigate } from "react-router"
import {
  Building2,
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
  deleteProvider,
  setProviderActive,
} from "@/lib/providers/actions"
import { ProviderFormSheet } from "@/components/providers/provider-form-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Provider } from "@/lib/providers/types"
import { cn } from "@/lib/utils"

type ProvidersManagerProps = {
  providers: Provider[]
  total: number
  page: number
  pageSize: number
  search: string | null
  onMutated?: () => void
}

function pageHref(page: number, search: string | null) {
  const params = new URLSearchParams()
  if (page > 1) params.set("page", String(page))
  const q = search?.trim()
  if (q) params.set("q", q)
  const qs = params.toString()
  return qs ? `?${qs}` : "?"
}

export function ProvidersManager({
  providers,
  total,
  page,
  pageSize,
  search,
  onMutated,
}: ProvidersManagerProps) {
  const navigate = useNavigate()
  const [query, setQuery] = React.useState(search ?? "")
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Provider | null>(null)
  const [deleting, setDeleting] = React.useState<Provider | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  React.useEffect(() => {
    setQuery(search ?? "")
  }, [search])

  React.useEffect(() => {
    const trimmed = query.trim()
    const current = (search ?? "").trim()
    if (trimmed === current) return

    const timer = window.setTimeout(() => {
      navigate(pageHref(1, trimmed || null))
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, navigate, search])

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(provider: Provider) {
    setEditing(provider)
    setSheetOpen(true)
  }

  function clearSearch() {
    setQuery("")
    navigate(pageHref(1, null))
  }

  async function toggleActive(provider: Provider) {
    setBusyId(provider.id)
    const result = await setProviderActive(provider.id, !provider.is_active)
    if (!result.ok) {
      toast.error("Could not update status", { description: result.error })
    } else {
      toast.success(
        provider.is_active ? "Provider deactivated" : "Provider activated"
      )
      onMutated?.()
    }
    setBusyId(null)
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    const result = await deleteProvider(deleting.id)
    if (!result.ok) {
      toast.error("Could not delete provider", { description: result.error })
    } else {
      toast.success("Provider deleted")
      setDeleting(null)
      onMutated?.()
    }
    setBusyId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search providers…"
            className="h-8 pr-8 pl-8"
            aria-label="Search providers"
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

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-3">
          <p className="text-muted-foreground text-sm">
            {total} provider{total === 1 ? "" : "s"}
          </p>
          <Button onClick={openCreate} size="sm">
            <Plus />
            Create provider
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Provider</TableHead>
              <TableHead className="hidden md:table-cell">Logo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-12 text-center"
                >
                  {search
                    ? `No providers match “${search}”.`
                    : "No providers yet. Create one before adding resources."}
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider) => (
                <TableRow key={provider.id} className="hover:bg-muted/40">
                  <TableCell className="pl-6">
                    <button
                      type="button"
                      onClick={() => openEdit(provider)}
                      className="flex items-start gap-3 text-left"
                    >
                      <span className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                        {provider.logo_url ? (
                          <img
                            src={provider.logo_url}
                            alt=""
                            className="size-full object-contain"
                          />
                        ) : (
                          <Building2 className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 space-y-0.5">
                        <span className="block font-medium">
                          {provider.name}
                        </span>
                        <span className="text-muted-foreground line-clamp-2 block text-xs">
                          {provider.description || "—"}
                        </span>
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {provider.logo_url ? (
                      <span className="text-muted-foreground max-w-[14rem] truncate text-xs">
                        {provider.logo_url.replace(/^https?:\/\//, "")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-medium",
                        provider.is_active
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {provider.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={busyId === provider.id}
                            aria-label={`Actions for ${provider.name}`}
                          />
                        }
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(provider)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleActive(provider)}
                        >
                          {provider.is_active ? <PowerOff /> : <Power />}
                          {provider.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(provider)}
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

      {totalPages > 1 ? (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
            {total}
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={page > 1 ? pageHref(page - 1, search) : undefined}
                  aria-disabled={page <= 1}
                  className={
                    page <= 1 ? "pointer-events-none opacity-50" : undefined
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href={pageHref(pageNum, search)}
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
                    page < totalPages ? pageHref(page + 1, search) : undefined
                  }
                  aria-disabled={page >= totalPages}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}

      <ProviderFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        provider={editing}
        onSaved={onMutated}
      />

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>
              A provider can’t be deleted while resources still reference it.
              Reassign or delete those resources first, or deactivate the
              provider instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={busyId === deleting?.id}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
