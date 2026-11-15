import { supabase } from "../supabaseClient";

const PROFILE_FIELDS =
  "display_name, description, is_public, topics, avatar_path, message_permission";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
}

function getFileExtension(file) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function normalizeProfile(profile) {
  return {
    ...profile,
    topics: profile.topics ?? [],
  };
}

export function validateAvatar(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Choose a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Choose an image smaller than 2 MB.";
  }

  return "";
}

export async function fetchProfile(userId) {
  requireSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  const profile = normalizeProfile(data);
  let avatarUrl = "";

  if (profile.avatar_path) {
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_path, 60 * 60);

    if (signedUrlError) {
      throw signedUrlError;
    }

    avatarUrl = signedUrlData.signedUrl;
  }

  return { profile, avatarUrl };
}

export async function uploadAvatar(userId, file) {
  requireSupabase();

  const avatarPath = `${userId}/avatar.${getFileExtension(file)}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(avatarPath, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_path: avatarPath })
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }

  const { data: signedUrlData, error: signedUrlError } =
    await supabase.storage
      .from("avatars")
      .createSignedUrl(avatarPath, 60 * 60);

  if (signedUrlError) {
    throw signedUrlError;
  }

  return {
    avatarPath,
    avatarUrl: signedUrlData.signedUrl,
  };
}

export async function saveProfile(userId, profile) {
  requireSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: profile.display_name.trim(),
      description: profile.description.trim(),
      is_public: profile.is_public,
      topics: profile.topics,
      message_permission: profile.message_permission,
    })
    .eq("id", userId)
    .select(PROFILE_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return normalizeProfile(data);
}
