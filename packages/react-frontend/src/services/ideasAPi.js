import { supabase } from "../supabaseClient";

const IDEA_COLUMNS =
  "id, user_id, title, description, looking_for, is_public, author_username, created_at";

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the repo-root .env file.",
    );
  }
}

function throwIfError(error) {
  if (error) {
    throw new Error(error.message);
  }
}

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  throwIfError(error);

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return user;
}

export async function getIdeas() {
  requireSupabase();

  const user = await requireUser();

  const { data, error } = await supabase
    .from("ideas")
    .select(IDEA_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  throwIfError(error);
  return data;
}

export async function getPublicIdeas() {
  requireSupabase();

  await requireUser();

  const { data, error } = await supabase
    .from("ideas")
    .select(
      "id, user_id, title, description, looking_for, author_username, created_at",
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  throwIfError(error);
  return data;
}

export async function createIdea(idea) {
  requireSupabase();

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      title: idea.title,
      description: idea.description,
      looking_for: idea.lookingFor,
      is_public: idea.isPublic,
    })
    .select(IDEA_COLUMNS)
    .single();

  throwIfError(error);
  return data;
}

export async function updateIdea(id, idea) {
  requireSupabase();

  const { data, error } = await supabase
    .from("ideas")
    .update({
      title: idea.title,
      description: idea.description,
      looking_for: idea.lookingFor,
      is_public: idea.isPublic,
    })
    .eq("id", id)
    .select(IDEA_COLUMNS)
    .single();

  throwIfError(error);
  return data;
}

export async function setIdeaVisibility(id, isPublic) {
  requireSupabase();

  const { data, error } = await supabase
    .from("ideas")
    .update({ is_public: isPublic })
    .eq("id", id)
    .select(IDEA_COLUMNS)
    .single();

  throwIfError(error);
  return data;
}

export async function deleteIdea(id) {
  requireSupabase();

  const { error } = await supabase.from("ideas").delete().eq("id", id);

  throwIfError(error);
}
