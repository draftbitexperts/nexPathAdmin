import type { Metadata } from "next"

import { CategoriesManager } from "@/components/categories/categories-manager"
import { PageHeader } from "@/components/dashboard/page-header"
import { listCategories } from "@/lib/categories/queries"
import type { CategoryWithPlacements } from "@/lib/categories/types"

export const metadata: Metadata = {
  title: "Categories",
}

type CategoriesPageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)

  let categories: CategoryWithPlacements[] = []
  let total = 0
  let pageSize = 20
  let error: string | null = null

  try {
    const result = await listCategories(page)
    categories = result.categories
    total = result.total
    pageSize = result.pageSize
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load categories"
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
      />
    </div>
  )
}
