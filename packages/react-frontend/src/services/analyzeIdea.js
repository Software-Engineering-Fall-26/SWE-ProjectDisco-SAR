import { supabase } from "../supabaseClient";

async function postIdea(path, idea, fallbackError) {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the repo-root .env file.",
    );
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session?.access_token) {
    throw new Error("You must be signed in.");
  }

  const response = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: idea.title,
      description: idea.description,
      lookingFor: idea.looking_for || idea.lookingFor || "",
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || fallbackError);
  }

  return payload;
}

export function analyzeIdea(idea) {
  return postIdea("/api/analyze-idea", idea, "Could not analyze this idea.");
}

export function enhanceIdea(idea) {
  return postIdea("/api/enhance-idea", idea, "Could not enhance this idea.");
}
