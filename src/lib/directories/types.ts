export type Directory = {
  id: string
  name: string
  description: string | null
  external_url: string | null
  icon_key: string | null
  sort_order: number
  show_on_resources: boolean
  is_active: boolean
}

export type DirectoryInput = {
  name: string
  description: string
  external_url: string
  icon_key: string
  sort_order: number
  show_on_resources: boolean
  is_active?: boolean
}
