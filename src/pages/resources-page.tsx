import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { PageHeader } from "@/components/dashboard/page-header";
import { ResourcesPageSkeleton } from "@/components/dashboard/page-loading";
import { ResourcesManager } from "@/components/resources/resources-manager";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  listCategoriesForSelect,
  listProvidersForSelect,
  listResources,
} from "@/lib/resources/queries";
import type {
  CategoryOption,
  ProviderOption,
  ResourceWithRelations,
} from "@/lib/resources/types";

export function ResourcesPage() {
  useDocumentTitle("Resources");
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const providerId = searchParams.get("provider")?.trim() || null;
  const search = searchParams.get("q")?.trim() || null;

  const [resources, setResources] = useState<ResourceWithRelations[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [resourcesResult, providersResult, categoriesResult] =
        await Promise.all([
          listResources(page, providerId, search),
          listProvidersForSelect(),
          listCategoriesForSelect(),
        ]);
      setResources(resourcesResult.resources);
      setTotal(resourcesResult.total);
      setPageSize(resourcesResult.pageSize);
      setProviders(providersResult);
      setCategories(categoriesResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resources");
    } finally {
      setReady(true);
    }
  }, [page, providerId, search]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!ready) {
    return <ResourcesPageSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Resources" />

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
        search={search}
        onMutated={loadData}
      />
    </div>
  );
}
