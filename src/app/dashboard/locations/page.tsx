import type { Metadata } from "next"

import { PageHeader } from "@/components/dashboard/page-header"
import { LocationsManager } from "@/components/locations/locations-manager"
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

export const metadata: Metadata = {
  title: "Locations",
}

type LocationsPageProps = {
  searchParams: Promise<{
    tab?: string
    page?: string
    state?: string
    q?: string
  }>
}

function parseTab(value: string | undefined): LocationTab {
  if (value && LOCATION_TABS.includes(value as LocationTab)) {
    return value as LocationTab
  }
  return "states"
}

export default async function LocationsPage({
  searchParams,
}: LocationsPageProps) {
  const params = await searchParams
  const tab = parseTab(params.tab)
  const page = Math.max(1, Number(params.page) || 1)
  const requestedState = params.state?.trim().toUpperCase() || null
  const search = params.q?.trim() || null

  let states: State[] = []
  let areas: Area[] = []
  let durations: CommunityDuration[] = []
  let stateOptions: StateOption[] = []
  let stateCode: string | null = null
  let total = 0
  let pageSize = LOCATIONS_PAGE_SIZE
  let error: string | null = null

  try {
    stateOptions = await listStatesForSelect()
    stateCode =
      requestedState &&
      stateOptions.some((option) => option.code === requestedState)
        ? requestedState
        : (stateOptions[0]?.code ?? null)

    if (tab === "states") {
      const result = await listStates(page, search)
      states = result.states
      total = result.total
      pageSize = result.pageSize
    } else if (tab === "areas") {
      if (stateCode) {
        const result = await listAreas(stateCode, page, search)
        areas = result.areas
        total = result.total
        pageSize = result.pageSize
      }
    } else {
      const result = await listCommunityDurations(page, search)
      durations = result.durations
      total = result.total
      pageSize = result.pageSize
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load locations"
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
      />
    </div>
  )
}
