import type { Metadata } from "next"

import { PageHeader } from "@/components/dashboard/page-header"
import { DirectoriesManager } from "@/components/directories/directories-manager"
import { listDirectories } from "@/lib/directories/queries"
import type { Directory } from "@/lib/directories/types"

export const metadata: Metadata = {
  title: "Directories",
}

type DirectoriesPageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function DirectoriesPage({
  searchParams,
}: DirectoriesPageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)

  let directories: Directory[] = []
  let total = 0
  let pageSize = 20
  let error: string | null = null

  try {
    const result = await listDirectories(page)
    directories = result.directories
    total = result.total
    pageSize = result.pageSize
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load directories"
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
      />
    </div>
  )
}
