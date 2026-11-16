import { supabase } from "../supabaseClient";
import { assertCanPublish, filterBoardIdeas } from "./contentModeration";
import { getReportedIdeaIds } from "./reportsApi";

const IDEA_COLUMNS =
  "id, user_id, title, description, looking_for, is_public, author_username, created_at";

const IDEA_COLUMNS_WITH_MODERATION =
  `${IDEA_COLUMNS}, moderation_status, moderation_reason`;

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

function keepModeration(saved, idea) {
  if (saved?.moderation_status) {
    return saved;
  }

  return {
    ...saved,
    moderation_status: idea?.moderation_status || "visible",
    moderation_reason: idea?.moderation_reason || "",
  };
}

function isMissingModerationColumn(error) {
  const message = `${error?.message || ""} ${error?.details || ""}`;
  return (
    message.includes("moderation_status") ||
    message.includes("moderation_reason")
  );
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

async function selectIdeaRows(applyFilters) {
  const primary = await applyFilters(
    supabase.from("ideas").select(IDEA_COLUMNS_WITH_MODERATION),
  );

  if (!primary.error) {
    return primary.data ?? [];
  }

  if (!isMissingModerationColumn(primary.error)) {
    throw new Error(primary.error.message);
  }

  const fallback = await applyFilters(
    supabase.from("ideas").select(IDEA_COLUMNS),
  );

  throwIfError(fallback.error);
  return fallback.data ?? [];
}

export async function getIdeas() {
  requireSupabase();

  const user = await requireUser();

  return selectIdeaRows((query) =>
    query.eq("user_id", user.id).order("created_at", { ascending: false }),
  );
}

export async function getPublicIdeas({ userId } = {}) {
  requireSupabase();

  await requireUser();

  const data = await selectIdeaRows((query) => {
    let next = query
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (userId) {
      next = next.eq("user_id", userId);
    }

    return next;
  });

  const reportedIds = await getReportedIdeaIds();
  return filterBoardIdeas(data, reportedIds);
}

export async function getIdeaLikeSummaries(ideaIds) {
  requireSupabase();

  if (ideaIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase.rpc("get_public_idea_like_summaries", {
    p_idea_ids: ideaIds,
  });

  throwIfError(error);

  return Object.fromEntries(
    data.map((summary) => [
      summary.idea_id,
      {
        count: Number(summary.like_count),
        likedByCurrentUser: summary.liked_by_current_user,
      },
    ]),
  );
}

export async function setIdeaLike(ideaId, shouldLike) {
  requireSupabase();

  const user = await requireUser();

  if (shouldLike) {
    const { error } = await supabase.from("idea_likes").insert({
      idea_id: ideaId,
      user_id: user.id,
    });

    throwIfError(error);
    return;
  }

  const { error } = await supabase
    .from("idea_likes")
    .delete()
    .eq("idea_id", ideaId)
    .eq("user_id", user.id);

  throwIfError(error);
}

export async function createIdea(idea) {
  requireSupabase();

  if (idea.isPublic) {
    assertCanPublish(idea);
  }

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

  if (idea.isPublic) {
    assertCanPublish(idea);
  }

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
  return keepModeration(data, idea);
}

export async function setIdeaVisibility(id, isPublic, idea) {
  requireSupabase();

  if (isPublic) {
    assertCanPublish({
      ...idea,
      isPublic: true,
    });
  }

  const { data, error } = await supabase
    .from("ideas")
    .update({ is_public: isPublic })
    .eq("id", id)
    .select(IDEA_COLUMNS)
    .single();

  throwIfError(error);
  return keepModeration(data, idea);
}

export async function deleteIdea(id) {
  requireSupabase();

  const { error } = await supabase.from("ideas").delete().eq("id", id);

  throwIfError(error);
}
