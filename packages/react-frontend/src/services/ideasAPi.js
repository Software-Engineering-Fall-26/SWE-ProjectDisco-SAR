import { supabase } from "../supabaseClient";

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

export async function getIdeas() {
  requireSupabase();

  const { data, error } = await supabase
    .from("ideas")
    .select("id, title, description, created_at")
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
    })
    .select()
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
    })
    .eq("id", id)
    .select()
    .single();

  throwIfError(error);
  return data;
}

export async function deleteIdea(id) {
  requireSupabase();

  const { error } = await supabase.from("ideas").delete().eq("id", id);

  throwIfError(error);
}
