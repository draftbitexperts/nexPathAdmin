import type { Metadata } from "next"

import { PageHeader } from "@/components/dashboard/page-header"
import { ProvidersManager } from "@/components/providers/providers-manager"
import { listProvidersPage } from "@/lib/providers/queries"
import type { Provider } from "@/lib/providers/types"

export const metadata: Metadata = {
  title: "Providers",
}

type ProvidersPageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function ProvidersPage({
  searchParams,
}: ProvidersPageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)

  let providers: Provider[] = []
  let total = 0
  let pageSize = 20
  let error: string | null = null

  try {
    const result = await listProvidersPage(page)
    providers = result.providers
    total = result.total
    pageSize = result.pageSize
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load providers"
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Providers"
        description="The organization behind a resource. Every resource belongs to exactly one provider."
      />

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
      />
    </div>
  )
}
