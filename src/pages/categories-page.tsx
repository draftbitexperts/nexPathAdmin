import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { CategoriesManager } from "@/components/categories/categories-manager"
import { PageHeader } from "@/components/dashboard/page-header"
import { CategoriesPageSkeleton } from "@/components/dashboard/page-loading"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { listCategories } from "@/lib/categories/queries"
import type { CategoryWithPlacements } from "@/lib/categories/types"

export function CategoriesPage() {
  useDocumentTitle("Categories")
  const [searchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)

  const [categories, setCategories] = useState<CategoryWithPlacements[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listCategories(page)
      setCategories(result.categories)
      setTotal(result.total)
      setPageSize(result.pageSize)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return <CategoriesPageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Categories" />

      {error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          Could not load categories: {error}
        </div>
      ) : null}

      <CategoriesManager
        categories={categories}
        total={total}
        page={page}
        pageSize={pageSize}
        onMutated={loadData}
      />
    </div>
  )
}
