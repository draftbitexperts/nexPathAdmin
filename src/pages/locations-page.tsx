import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"

import { PageHeader } from "@/components/dashboard/page-header"
import { LocationsPageSkeleton } from "@/components/dashboard/page-loading"
import { LocationsManager } from "@/components/locations/locations-manager"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { LOCATIONS_PAGE_SIZE } from "@/lib/locations/constants"
import {
  listAreas,
  listCommunityDurations,
  listStates,
  listStatesForSelect,
} from "@/lib/locations/queries"
import {
  LOCATION_TABS,
  type Area,
  type CommunityDuration,
  type LocationTab,
  type State,
  type StateOption,
} from "@/lib/locations/types"

function parseTab(value: string | null): LocationTab {
  if (value && LOCATION_TABS.includes(value as LocationTab)) {
    return value as LocationTab
  }
  return "states"
}

export function LocationsPage() {
  useDocumentTitle("Locations")
  const [searchParams] = useSearchParams()
  const tab = parseTab(searchParams.get("tab"))
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const requestedState = searchParams.get("state")?.trim().toUpperCase() || null
  const search = searchParams.get("q")?.trim() || null

  const [states, setStates] = useState<State[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [durations, setDurations] = useState<CommunityDuration[]>([])
  const [stateOptions, setStateOptions] = useState<StateOption[]>([])
  const [stateCode, setStateCode] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(LOCATIONS_PAGE_SIZE)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const options = await listStatesForSelect()
      setStateOptions(options)

      const resolvedStateCode =
        requestedState &&
        options.some((option) => option.code === requestedState)
          ? requestedState
          : (options[0]?.code ?? null)
      setStateCode(resolvedStateCode)

      if (tab === "states") {
        const result = await listStates(page, search)
        setStates(result.states)
        setTotal(result.total)
        setPageSize(result.pageSize)
      } else if (tab === "areas") {
        if (resolvedStateCode) {
          const result = await listAreas(resolvedStateCode, page, search)
          setAreas(result.areas)
          setTotal(result.total)
          setPageSize(result.pageSize)
        } else {
          setAreas([])
          setTotal(0)
        }
      } else {
        const result = await listCommunityDurations(page, search)
        setDurations(result.durations)
        setTotal(result.total)
        setPageSize(result.pageSize)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load locations")
    } finally {
      setLoading(false)
    }
  }, [tab, page, requestedState, search])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return <LocationsPageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Locations"
        description="Onboarding demographic dropdowns: states, local areas, and community durations."
      />

      {error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          Could not load locations: {error}
        </div>
      ) : null}

      <LocationsManager
        tab={tab}
        states={states}
        areas={areas}
        durations={durations}
        stateOptions={stateOptions}
        stateCode={stateCode}
        search={search}
        total={total}
        page={page}
        pageSize={pageSize}
        onMutated={loadData}
      />
    </div>
  )
}
