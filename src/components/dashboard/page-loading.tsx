import type { ReactNode } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title={title}
        actions={
          action ? <Skeleton className="h-9 w-32 rounded-lg" /> : undefined
        }
      />
      {children}
    </div>
  );
}

function TableRowSkeleton({
  columns,
  className,
}: {
  columns: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 border-b border-border/60 px-6 py-3.5 last:border-b-0",
        className,
      )}
    >
      {columns}
    </div>
  );
}

export function ManagerTableSkeleton({
  toolbarLeft,
  rows = 8,
  action = true,
  renderRow,
}: {
  toolbarLeft?: ReactNode;
  rows?: number;
  action?: boolean;
  renderRow: () => ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {toolbarLeft ?? <Skeleton className="h-4 w-24" />}
        </div>
        {action ? <Skeleton className="h-8 w-36 rounded-lg" /> : null}
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i}>{renderRow()}</div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <PageShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
              <Skeleton className="size-9 rounded-lg" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border-border/70 flex flex-col gap-3 rounded-xl border p-4 shadow-sm"
            >
              <Skeleton className="size-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="border-border/60 shadow-sm lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <Skeleton className="size-[220px] rounded-full" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="border-border/60 shadow-sm xl:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-0 px-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton
                key={i}
                columns={
                  <>
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="hidden h-4 w-12 md:block" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="ml-auto hidden h-4 w-16 sm:block" />
                  </>
                }
              />
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm xl:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function SearchFieldSkeleton() {
  return (
    <div className="flex justify-end">
      <Skeleton className="h-8 w-full rounded-lg sm:max-w-xs" />
    </div>
  );
}

export function ResourcesPageSkeleton() {
  return (
    <PageShell title="Resources">
      <div className="space-y-4">
        <SearchFieldSkeleton />
        <ManagerTableSkeleton
          toolbarLeft={
            <>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full rounded-lg sm:w-48" />
            </>
          }
          renderRow={() => (
            <TableRowSkeleton
              columns={
                <>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="hidden h-4 w-24 md:block" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <div className="hidden gap-1 lg:flex">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                </>
              }
            />
          )}
        />
      </div>
    </PageShell>
  );
}

export function DirectoriesPageSkeleton() {
  return (
    <PageShell title="Directories">
      <div className="space-y-4">
        <SearchFieldSkeleton />
        <ManagerTableSkeleton
          renderRow={() => (
            <TableRowSkeleton
              columns={
                <>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Skeleton className="mt-0.5 size-8 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="hidden h-3 w-32 md:block" />
                  <Skeleton className="hidden h-4 w-8 sm:block" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                </>
              }
            />
          )}
        />
      </div>
    </PageShell>
  );
}

export function ProvidersPageSkeleton() {
  return (
    <PageShell title="Providers">
      <div className="space-y-4">
        <SearchFieldSkeleton />
        <ManagerTableSkeleton
          renderRow={() => (
            <TableRowSkeleton
              columns={
                <>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Skeleton className="mt-0.5 size-8 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="hidden h-3 w-32 md:block" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                </>
              }
            />
          )}
        />
      </div>
    </PageShell>
  );
}

export function CategoriesPageSkeleton() {
  return (
    <PageShell title="Categories">
      <div className="space-y-4">
        <SearchFieldSkeleton />
        <ManagerTableSkeleton
          renderRow={() => (
            <TableRowSkeleton
              columns={
                <>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Skeleton className="mt-0.5 size-8 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                  <div className="hidden gap-1 md:flex">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="hidden h-4 w-16 lg:block" />
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                </>
              }
            />
          )}
        />
      </div>
    </PageShell>
  );
}

export function LocationsPageSkeleton() {
  return (
    <PageShell title="Locations">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-80 max-w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg sm:max-w-xs" />
        </div>
        <ManagerTableSkeleton
          renderRow={() => (
            <TableRowSkeleton
              columns={
                <>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="hidden h-5 w-12 rounded-full sm:block" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                </>
              }
            />
          )}
        />
      </div>
    </PageShell>
  );
}

export function AnalyticsPageSkeleton() {
  return (
    <PageShell title="Analytics">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 max-w-full rounded-lg" />
        <ManagerTableSkeleton
          action={false}
          toolbarLeft={
            <>
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-8 w-40 rounded-lg" />
              <Skeleton className="h-8 w-36 rounded-lg" />
            </>
          }
          renderRow={() => (
            <TableRowSkeleton
              columns={
                <>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="hidden h-4 w-20 md:block" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="hidden h-4 w-20 lg:block" />
                </>
              }
            />
          )}
        />
      </div>
    </PageShell>
  );
}

export function LibraryPageSkeleton() {
  return (
    <PageShell title="Library" action>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="mt-2 h-7 w-12" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent className="space-y-0 px-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRowSkeleton
              key={i}
              columns={
                <>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="hidden h-4 w-10 md:block" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="hidden h-4 w-16 sm:block" />
                </>
              }
            />
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function UploadPageSkeleton() {
  return (
    <PageShell title="Upload">
      <Card className="border-border/60 mx-auto max-w-2xl shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-40" />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </CardFooter>
      </Card>
    </PageShell>
  );
}

export function SettingsPageSkeleton() {
  return (
    <PageShell title="Settings">
      <div className="mx-auto grid max-w-3xl gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="border-border/70 flex flex-col items-center gap-2 rounded-xl border p-4"
                >
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Skeleton className="h-9 w-28 rounded-lg" />
          </CardFooter>
        </Card>
      </div>
    </PageShell>
  );
}
