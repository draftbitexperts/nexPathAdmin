import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"

import { GoalCategoriesManager } from "@/components/goal-categories/goal-categories-manager"
import { CategoriesPageSkeleton } from "@/components/dashboard/page-loading"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { listGoalCategories } from "@/lib/goal-categories/queries"
import type { GoalCategory } from "@/lib/goal-categories/types"

export function GoalCategoriesPage() {
  useDocumentTitle("Goal Categories")
  const [searchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const [goalCategories, setGoalCategories] = useState<GoalCategory[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listGoalCategories(page)
      setGoalCategories(result.goalCategories)
      setTotal(result.total)
      setPageSize(result.pageSize)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load goal categories",
      )
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) return <CategoriesPageSkeleton />

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          Could not load goal categories: {error}
        </div>
      ) : null}

      <GoalCategoriesManager
        goalCategories={goalCategories}
        total={total}
        page={page}
        pageSize={pageSize}
        onMutated={loadData}
      />
    </div>
  )
}
