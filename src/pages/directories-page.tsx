import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"

import { DirectoriesManager } from "@/components/directories/directories-manager"
import { PageHeader } from "@/components/dashboard/page-header"
import { DirectoriesPageSkeleton } from "@/components/dashboard/page-loading"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { listDirectories } from "@/lib/directories/queries"
import type { Directory } from "@/lib/directories/types"

export function DirectoriesPage() {
  useDocumentTitle("Directories")
  const [searchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)

  const [directories, setDirectories] = useState<Directory[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listDirectories(page)
      setDirectories(result.directories)
      setTotal(result.total)
      setPageSize(result.pageSize)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load directories")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return <DirectoriesPageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Directories"
        description="Regional starting points shown as a carousel on the Resources tab. Standalone — no provider or category link."
      />

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
        onMutated={loadData}
      />
    </div>
  )
}
