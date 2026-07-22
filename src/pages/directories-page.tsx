import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"

import { DirectoriesManager } from "@/components/directories/directories-manager"
import { PageHeader } from "@/components/dashboard/page-header"
import { DirectoriesPageSkeleton } from "@/components/dashboard/page-loading"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { listDirectories } from "@/lib/directories/queries"
import type { DirectoryWithRelations } from "@/lib/directories/types"
import { listStatesForSelect } from "@/lib/locations/queries"
import type { StateOption } from "@/lib/locations/types"

export function DirectoriesPage() {
  useDocumentTitle("Directories")
  const [searchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const search = searchParams.get("q")?.trim() || null

  const [directories, setDirectories] = useState<DirectoryWithRelations[]>([])
  const [stateOptions, setStateOptions] = useState<StateOption[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [result, states] = await Promise.all([
        listDirectories(page, search),
        listStatesForSelect(),
      ])
      setDirectories(result.directories)
      setTotal(result.total)
      setPageSize(result.pageSize)
      setStateOptions(states)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load directories")
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return <DirectoriesPageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Directories" />

      {error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          Could not load directories: {error}
        </div>
      ) : null}

      <DirectoriesManager
        directories={directories}
        total={total}
        page={page}
        pageSize={pageSize}
        search={search}
        stateOptions={stateOptions}
        onMutated={loadData}
      />
    </div>
  )
}
