import { supabase } from "../supabaseClient";

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  idea_like: true,
  idea_comment: true,
  collaboration_request: true,
};

function throwIfError(error) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, message, created_at, read_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  throwIfError(error);
  return data ?? [];
}

export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);

  throwIfError(error);
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  throwIfError(error);
}

export async function fetchNotificationPreferences(userId) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("idea_like, idea_comment, collaboration_request")
    .eq("user_id", userId)
    .maybeSingle();

  throwIfError(error);
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...data };
}

export async function saveNotificationPreferences(userId, preferences) {
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: userId,
        idea_like: preferences.idea_like,
        idea_comment: preferences.idea_comment,
        collaboration_request: preferences.collaboration_request,
      },
      { onConflict: "user_id" },
    );

  throwIfError(error);
}
