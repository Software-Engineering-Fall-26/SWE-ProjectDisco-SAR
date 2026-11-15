import { supabase } from "../supabaseClient";

const COMMENT_COLUMNS =
  "id, idea_id, user_id, author_username, content, created_at";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
}

function throwIfError(error) {
  if (error) {
    throw error;
  }
}

export async function getIdeaComments(ideaId) {
  requireSupabase();

  const { data, error } = await supabase
    .from("idea_comments")
    .select(COMMENT_COLUMNS)
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: true });

  throwIfError(error);
  return data;
}

export async function createIdeaComment(ideaId, content) {
  requireSupabase();

  const { data, error } = await supabase
    .from("idea_comments")
    .insert({ idea_id: ideaId, content: content.trim() })
    .select(COMMENT_COLUMNS)
    .single();

  throwIfError(error);
  return data;
}

export async function deleteIdeaComment(commentId) {
  requireSupabase();

  const { error } = await supabase
    .from("idea_comments")
    .delete()
    .eq("id", commentId);

  throwIfError(error);
}
