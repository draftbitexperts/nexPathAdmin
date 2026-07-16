import type { Metadata } from "next"

import { PageHeader } from "@/components/dashboard/page-header"
import { ResourcesManager } from "@/components/resources/resources-manager"
import {
  listCategoriesForSelect,
  listProviders,
  listResources,
} from "@/lib/resources/queries"
import type {
  CategoryOption,
  ProviderOption,
  ResourceWithRelations,
} from "@/lib/resources/types"

export const metadata: Metadata = {
  title: "Resources",
}

type ResourcesPageProps = {
  searchParams: Promise<{ page?: string; provider?: string }>
}

export default async function ResourcesPage({
  searchParams,
}: ResourcesPageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const providerId = params.provider?.trim() || null

  let resources: ResourceWithRelations[] = []
  let providers: ProviderOption[] = []
  let categories: CategoryOption[] = []
  let total = 0
  let pageSize = 20
  let error: string | null = null

  try {
    const [resourcesResult, providersResult, categoriesResult] =
      await Promise.all([
        listResources(page, providerId),
        listProviders(),
        listCategoriesForSelect(),
      ])
    resources = resourcesResult.resources
    total = resourcesResult.total
    pageSize = resourcesResult.pageSize
    providers = providersResult
    categories = categoriesResult
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load resources"
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Resources"
        description="Cards shown in Resources carousels and task feeds. Each belongs to a provider and can be linked into one or more categories."
      />

      {error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
          Could not load resources: {error}
        </div>
      ) : null}

      <ResourcesManager
        resources={resources}
        providers={providers}
        categories={categories}
        total={total}
        page={page}
        pageSize={pageSize}
        providerId={providerId}
      />
    </div>
  )
}
