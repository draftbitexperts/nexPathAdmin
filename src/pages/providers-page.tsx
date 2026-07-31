import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"

import { ProvidersPageSkeleton } from "@/components/dashboard/page-loading"
import { ProvidersManager } from "@/components/providers/providers-manager"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { listProviders } from "@/lib/providers/queries"
import type { Provider } from "@/lib/providers/types"

export function ProvidersPage() {
  useDocumentTitle("Providers")
  const [searchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const search = searchParams.get("q")?.trim() || null

  const [providers, setProviders] = useState<Provider[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listProviders(page, search)
      setProviders(result.providers)
      setTotal(result.total)
      setPageSize(result.pageSize)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load providers")
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return <ProvidersPageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          Could not load providers: {error}
        </div>
      ) : null}

      <ProvidersManager
        providers={providers}
        total={total}
        page={page}
        pageSize={pageSize}
        search={search}
        onMutated={loadData}
      />
    </div>
  )
}
