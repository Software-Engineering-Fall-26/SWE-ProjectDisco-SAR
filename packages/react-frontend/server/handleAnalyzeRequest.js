import { createClient } from "@supabase/supabase-js";

import { analyzeIdeaWithGroq } from "./analyzeIdea.js";
import { enhanceIdeaWithGroq } from "./enhanceIdea.js";
import { AnalysisError, normalizeIdeaInput } from "./groq.js";

async function requireSignedInUser({
  authorization,
  supabaseUrl,
  supabaseAnonKey,
}) {
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    throw new AnalysisError("You must be signed in.", 401);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AnalysisError(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the repo-root .env file.",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    throw new AnalysisError("You must be signed in.", 401);
  }

  return data.user;
}

export async function handleAnalyzeRequest({
  body,
  apiKey,
  authorization,
  supabaseUrl,
  supabaseAnonKey,
}) {
  await requireSignedInUser({ authorization, supabaseUrl, supabaseAnonKey });

  const idea = normalizeIdeaInput(body);
  return analyzeIdeaWithGroq(idea, apiKey);
}

export async function handleEnhanceRequest({
  body,
  apiKey,
  authorization,
  supabaseUrl,
  supabaseAnonKey,
}) {
  await requireSignedInUser({ authorization, supabaseUrl, supabaseAnonKey });

  const idea = normalizeIdeaInput(body);
  return enhanceIdeaWithGroq(idea, apiKey);
}
