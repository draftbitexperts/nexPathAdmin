export type Category = {
  id: string
  slug: string
  name: string
  short_description: string | null
  long_description: string | null
  icon_key: string | null
  is_active: boolean
}

export type CategoryInput = {
  slug: string
  name: string
  short_description: string
  long_description: string
  icon_key: string
  is_active?: boolean
}
