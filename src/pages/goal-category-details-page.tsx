import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, ListChecks, Sparkles } from "lucide-react"
import { Link, useParams, useSearchParams } from "react-router"

import { PathTasksManager } from "@/components/path-tasks/path-tasks-manager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { categoryIcon } from "@/lib/categories/icons"
import { getGoalCategory } from "@/lib/goal-categories/queries"
import { listPathTasks } from "@/lib/path-tasks/queries"
import type { PathTask } from "@/lib/path-tasks/types"
import {
  listCategoriesForSelect,
  listProvidersForSelect,
} from "@/lib/resources/queries"
import type { CategoryOption, ProviderOption } from "@/lib/resources/types"
import type { GoalCategory } from "@/lib/goal-categories/types"

export function GoalCategoryDetailsPage() {
  const { goalCategoryId } = useParams()
  const [searchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const [goalCategory, setGoalCategory] = useState<GoalCategory | null>(null)
  const [tasks, setTasks] = useState<PathTask[]>([])
  const [providers, setProviders] = useState<ProviderOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useDocumentTitle(goalCategory ? `${goalCategory.title} Tasks` : "Path Tasks")

  const loadData = useCallback(async () => {
    if (!goalCategoryId) {
      setError("Missing goal category id.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [category, tasksResult, providerOptions, categoryOptions] = await Promise.all([
        getGoalCategory(goalCategoryId),
        listPathTasks(goalCategoryId, page),
        listProvidersForSelect(),
        listCategoriesForSelect(),
      ])
      if (!category) {
        setError("Goal category not found.")
        return
      }
      setGoalCategory(category)
      setTasks(tasksResult.tasks)
      setProviders(providerOptions)
      setCategories(categoryOptions)
      setTotal(tasksResult.total)
      setPageSize(tasksResult.pageSize)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load path tasks")
    } finally {
      setLoading(false)
    }
  }, [goalCategoryId, page])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="w-full space-y-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-8 w-36" />
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="mt-5 h-7 w-56" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  const Icon = categoryIcon(goalCategory?.icon_key)
  const resourceCount = tasks.reduce(
    (count, task) => count + (task.path_task_resources?.length ?? 0),
    0,
  )

  return (
    <div className="w-full space-y-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={<Link to="/dashboard/goal-categories" />}
        >
          <ArrowLeft />
          Goal Categories
        </Button>
        <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          <div className="bg-primary/5 pointer-events-none absolute -top-20 -right-12 size-52 rounded-full blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-6" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {goalCategory?.title ?? "Goal category"}
                  </h1>
                  {goalCategory ? (
                    <Badge
                      variant="secondary"
                      className={
                        goalCategory.is_active
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }
                    >
                      {goalCategory.is_active ? "Active" : "Inactive"}
                    </Badge>
                  ) : null}
                </div>
                {goalCategory?.subtitle ? (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {goalCategory.subtitle}
                  </p>
                ) : null}
                <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
                  {goalCategory?.description ||
                    "Build the action items and resources that guide people through this goal."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-56">
              <div className="bg-muted/50 rounded-xl px-3 py-2.5">
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <ListChecks className="size-3.5" />
                  Tasks
                </div>
                <p className="mt-1 text-lg font-semibold tabular-nums">{total}</p>
              </div>
              <div className="bg-muted/50 rounded-xl px-3 py-2.5">
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Sparkles className="size-3.5" />
                  Resources
                </div>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {resourceCount}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {error ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <span>Could not load path tasks: {error}</span>
          <Button variant="outline" size="sm" onClick={loadData}>
            Try again
          </Button>
        </div>
      ) : goalCategory ? (
        <PathTasksManager
          goalCategoryId={goalCategory.id}
          tasks={tasks}
          providers={providers}
          categories={categories}
          total={total}
          page={page}
          pageSize={pageSize}
          onMutated={loadData}
        />
      ) : null}
    </div>
  )
}
