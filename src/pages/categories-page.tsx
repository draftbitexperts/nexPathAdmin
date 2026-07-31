import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"

import { CategoriesManager } from "@/components/categories/categories-manager"
import { CategoriesPageSkeleton } from "@/components/dashboard/page-loading"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { listCategories } from "@/lib/categories/queries"
import type { Category } from "@/lib/categories/types"
import {
  listProvidersForSelect,
  listResourcesForCategorySelect,
} from "@/lib/resources/queries"
import type { ProviderOption, ResourceOption } from "@/lib/resources/types"

export function CategoriesPage() {
  useDocumentTitle("Categories")
  const [searchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const search = searchParams.get("q")?.trim() || null

  const [categories, setCategories] = useState<Category[]>([])
  const [resources, setResources] = useState<ResourceOption[]>([])
  const [providers, setProviders] = useState<ProviderOption[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [categoriesResult, resourcesResult, providersResult] =
        await Promise.all([
          listCategories(page, search),
          listResourcesForCategorySelect(),
          listProvidersForSelect(),
        ])
      setCategories(categoriesResult.categories)
      setResources(resourcesResult)
      setProviders(providersResult)
      setTotal(categoriesResult.total)
      setPageSize(categoriesResult.pageSize)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return <CategoriesPageSkeleton />
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
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
        resources={resources}
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
