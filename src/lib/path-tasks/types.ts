import type { ResourceWithRelations } from "@/lib/resources/types"

export type PathTaskResourceLink = {
  resource_id: string
  sort_order: number
  resources: ResourceWithRelations | null
}

export type PathTask = {
  id: string
  goal_category_id: string
  title: string
  description: string | null
  subtitle: string | null
  completion_label: string | null
  uncompletion_label: string | null
  sort_order: number
  is_active: boolean
  path_task_resources?: PathTaskResourceLink[]
}

export type PathTaskInput = {
  title: string
  description: string
  subtitle: string
  completion_label: string
  uncompletion_label: string
  sort_order: number
  is_active: boolean
}
