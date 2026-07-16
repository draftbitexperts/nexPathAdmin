export type State = {
  code: string
  name: string
  has_local_areas: boolean
  sort_order: number
  is_active: boolean
}

export type StateInput = {
  code: string
  name: string
  has_local_areas: boolean
  sort_order: number
  is_active?: boolean
}

export type Area = {
  id: string
  state_code: string
  name: string
  sort_order: number
  is_active: boolean
}

export type AreaInput = {
  state_code: string
  name: string
  sort_order: number
  is_active?: boolean
}

/** Payload for syncing a state's areas from the state form. */
export type StateAreaSyncItem = {
  id?: string
  name: string
  sort_order: number
  is_active?: boolean
}

export type CommunityDuration = {
  id: string
  label: string
  sort_order: number
  is_active: boolean
}

export type CommunityDurationInput = {
  label: string
  sort_order: number
  is_active?: boolean
}

export type StateOption = {
  code: string
  name: string
  has_local_areas: boolean
}

export const LOCATION_TABS = ["states", "areas", "durations"] as const

export type LocationTab = (typeof LOCATION_TABS)[number]
