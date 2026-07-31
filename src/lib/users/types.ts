import type { AnalyticsEventProperties } from "@/lib/analytics/types";

export type UserState = {
  code: string;
  name: string | null;
  [key: string]: unknown;
};

export type UserArea = {
  id: string | number;
  name: string | null;
  [key: string]: unknown;
};

export type UserCommunityDuration = {
  id: string | number;
  label: string | null;
  [key: string]: unknown;
};

export type UserProfileDemographics = {
  id: string;
  email?: string | null;
  is_anonymous?: boolean | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  state_code: string | null;
  area_id: string | null;
  community_duration_id: string | null;
  community_duration_label?: string | null;
  onboarding_completed_at: string | null;
  birth_month?: number | null;
  birth_year?: number | null;
  role?: string | null;
  onboarding_step?: string | number | null;
  current_onboarding_step?: string | number | null;
  updated_at?: string | null;
  state?: UserState | null;
  area?: UserArea | null;
  community_duration?: UserCommunityDuration | null;
  [key: string]: unknown;
};

export type UserListItem = UserProfileDemographics;

export type ListUsersResult = {
  users: UserListItem[];
};

export type UserPathCategoryRef = {
  id?: string;
  slug?: string | null;
  title: string | null;
  subtitle?: string | null;
  description?: string | null;
  icon_key?: string | null;
  is_active?: boolean | null;
  [key: string]: unknown;
};

export type UserPathCategory = {
  goal_category_id: string;
  status: string | null;
  added_at: string | null;
  category: UserPathCategoryRef | UserPathCategoryRef[] | null;
};

export type UserAppointment = {
  id?: string;
  user_id?: string;
  title: string | null;
  starts_at: string | null;
  has_reminder?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserAnalyticsEvent = {
  id?: string;
  user_id?: string;
  resource_id?: string | null;
  category_id?: string | null;
  occurred_at: string;
  event_name: string;
  properties: AnalyticsEventProperties | null;
};

export type UserDevice = {
  id?: string;
  user_id?: string;
  install_id?: string | null;
  platform: string | null;
  model: string | null;
  os_version: string | null;
  app_version: string | null;
  push_token?: string | null;
  last_seen_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserTableCategory = {
  name: string | null;
  status: string | null;
  added_at: string | null;
};

export type UserTableMetrics = {
  categories: UserTableCategory[];
  devices: UserDevice[];
};

export type UserDetail = {
  profile: UserProfileDemographics | null;
  path: UserPathCategory[];
  appointments: UserAppointment[];
  events: UserAnalyticsEvent[];
  devices: UserDevice[];
};
