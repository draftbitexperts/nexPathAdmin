export type Provider = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  is_active: boolean
}

export type ProviderInput = {
  name: string
  description: string
  logo_url: string
  is_active?: boolean
}
