import { supabase } from "../supabaseClient";

const PROFILE_FIELDS = "id, display_name, description, topics, avatar_path";
const IDEA_FIELDS =
  "id, user_id, title, description, looking_for, author_username, created_at";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
}

async function getAvatarUrl(avatarPath) {
  if (!avatarPath) {
    return "";
  }

  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 60 * 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function fetchPublicMember(userId) {
  requireSupabase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .eq("is_public", true)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    return null;
  }

  const { data: ideas, error: ideasError } = await supabase
    .from("ideas")
    .select(IDEA_FIELDS)
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (ideasError) {
    throw ideasError;
  }

  const avatarUrl = await getAvatarUrl(profile.avatar_path);

  return {
    profile: { ...profile, topics: profile.topics ?? [] },
    avatarUrl,
    ideas: ideas ?? [],
  };
}

export async function fetchPublicLinkedInAccount(userId) {
  requireSupabase();

  const { data, error } = await supabase
    .from("social_accounts")
    .select("provider, display_name")
    .eq("user_id", userId)
    .eq("provider", "linkedin")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
