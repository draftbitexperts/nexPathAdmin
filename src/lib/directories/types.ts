export type Directory = {
  id: string
  name: string
  description: string | null
  external_url: string
  is_active: boolean
  state_code: string
  area_id: string | null
  is_juvenile_justice_centered: boolean
}

export type DirectoryWithRelations = Directory & {
  areas: { name: string } | null
  states: { name: string } | null
}

export type DirectoryInput = {
  name: string
  description: string
  external_url: string
  state_code: string
  area_id: string | null
  is_juvenile_justice_centered: boolean
  is_active?: boolean
}

export type AreaOption = {
  id: string
  name: string
}
