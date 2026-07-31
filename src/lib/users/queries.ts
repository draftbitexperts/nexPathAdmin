import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ListUsersResult,
  UserDetail,
  UserListItem,
} from "@/lib/users/types";

export async function listUsers(): Promise<ListUsersResult> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, state:states(code, name), area:areas(id, name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    users: (data ?? []) as UserListItem[],
  };
}

function userIdOrThrow(userId: string): string {
  const id = userId.trim();
  if (!id) throw new Error("A user ID is required");
  return id;
}

export async function getUserDetail(userId: string): Promise<UserDetail> {
  const selectedUserId = userIdOrThrow(userId);
  const supabase = getSupabaseBrowserClient();
  const [
    profileResult,
    pathResult,
    appointmentsResult,
    eventsResult,
    devicesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, state:states(code, name), area:areas(id, name)")
      .eq("id", selectedUserId)
      .maybeSingle(),
    supabase
      .from("user_path_categories")
      .select(
        "goal_category_id, status, added_at, category:goal_categories(id, slug, title, subtitle, description, icon_key, is_active)",
      )
      .eq("user_id", selectedUserId)
      .order("added_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("*")
      .eq("user_id", selectedUserId)
      .order("starts_at", { ascending: false }),
    supabase
      .from("analytics_events")
      .select("id, user_id, occurred_at, event_name, properties")
      .eq("user_id", selectedUserId)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("user_devices")
      .select("*")
      .eq("user_id", selectedUserId)
      .order("last_seen_at", { ascending: false }),
  ]);

  const resultErrors = [
    profileResult.error,
    pathResult.error,
    appointmentsResult.error,
    eventsResult.error,
    devicesResult.error,
  ];
  const error = resultErrors.find(Boolean);
  if (error) {
    console.error("Failed to load user details", {
      profile: profileResult.error,
      path: pathResult.error,
      appointments: appointmentsResult.error,
      analyticsEvents: eventsResult.error,
      devices: devicesResult.error,
    });
    throw new Error(error.message);
  }

  return {
    profile: profileResult.data as UserDetail["profile"],
    path: (pathResult.data ?? []) as UserDetail["path"],
    appointments: (appointmentsResult.data ?? []) as UserDetail["appointments"],
    events: (eventsResult.data ?? []) as UserDetail["events"],
    devices: (devicesResult.data ?? []) as UserDetail["devices"],
  };
}
