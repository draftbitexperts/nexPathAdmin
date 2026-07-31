import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { LocationsPageSkeleton } from "@/components/dashboard/page-loading";
import { LocationsManager } from "@/components/locations/locations-manager";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { LOCATIONS_PAGE_SIZE } from "@/lib/locations/constants";
import {
  listAreas,
  listStates,
  listStatesForSelect,
} from "@/lib/locations/queries";
import {
  LOCATION_TABS,
  type Area,
  type LocationTab,
  type State,
  type StateOption,
} from "@/lib/locations/types";

function parseTab(value: string | null): LocationTab {
  if (value && LOCATION_TABS.includes(value as LocationTab)) {
    return value as LocationTab;
  }
  return "states";
}

export function LocationsPage() {
  useDocumentTitle("Locations");
  const [searchParams] = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const requestedState =
    searchParams.get("state")?.trim().toUpperCase() || null;
  const search = searchParams.get("q")?.trim() || null;

  const [states, setStates] = useState<State[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [stateCode, setStateCode] = useState<string | null>(null);
  const [statesTotal, setStatesTotal] = useState(0);
  const [areasTotal, setAreasTotal] = useState(0);
  const [pageSize, setPageSize] = useState(LOCATIONS_PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const readyRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);

    try {
      const optionsResult = await listStatesForSelect();
      if (requestId !== requestIdRef.current) return;

      const resolvedStateCode =
        requestedState &&
        optionsResult.some((option) => option.code === requestedState)
          ? requestedState
          : null;
      setStateOptions(optionsResult);
      setStateCode(resolvedStateCode);

      // First visit: load both tabs so switching never flashes empty states.
      if (!readyRef.current) {
        const statesPage = tab === "states" ? page : 1;
        const statesSearch = tab === "states" ? search : null;
        const areasPage = tab === "areas" ? page : 1;
        const areasSearch = tab === "areas" ? search : null;

        const [statesResult, areasResult] = await Promise.all([
          listStates(statesPage, statesSearch),
          listAreas(areasPage, areasSearch, resolvedStateCode),
        ]);
        if (requestId !== requestIdRef.current) return;

        setStates(statesResult.states);
        setStatesTotal(statesResult.total);
        setAreas(areasResult.areas);
        setAreasTotal(areasResult.total);
        setPageSize(
          tab === "states" ? statesResult.pageSize : areasResult.pageSize,
        );
        readyRef.current = true;
        setReady(true);
        return;
      }

      // After first load: keep existing rows visible and update in place.
      if (tab === "states") {
        const result = await listStates(page, search);
        if (requestId !== requestIdRef.current) return;
        setStates(result.states);
        setStatesTotal(result.total);
        setPageSize(result.pageSize);
      } else {
        const result = await listAreas(page, search, resolvedStateCode);
        if (requestId !== requestIdRef.current) return;
        setAreas(result.areas);
        setAreasTotal(result.total);
        setPageSize(result.pageSize);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to load locations",
      );
      readyRef.current = true;
      setReady(true);
    }
  }, [tab, page, requestedState, search]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!ready) {
    return <LocationsPageSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
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
        stateOptions={stateOptions}
        stateCode={stateCode}
        search={search}
        total={tab === "states" ? statesTotal : areasTotal}
        page={page}
        pageSize={pageSize}
        onMutated={loadData}
      />
    </div>
  );
}
