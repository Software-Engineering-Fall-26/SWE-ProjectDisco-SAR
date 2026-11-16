import { supabase } from "../supabaseClient";
import { isAllowedReportReason } from "./contentModeration";

const SETUP_MESSAGE =
  "Reporting isn't available yet. Run supabase/idea_moderation.sql " +
  "in the Supabase SQL editor, then try again.";

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the repo-root .env file.",
    );
  }
}

function isMissingReportsTable(error) {
  const message = `${error?.message || ""} ${error?.details || ""}`;
  return /idea_reports|schema cache/i.test(message);
}

export async function getReportedIdeaIds() {
  requireSupabase();

  const { data, error } = await supabase.from("idea_reports").select("idea_id");

  if (error) {
    if (isMissingReportsTable(error)) {
      return new Set();
    }

    throw new Error(error.message);
  }

  return new Set((data || []).map((row) => row.idea_id));
}

export async function reportPublicIdea({ ideaId, reason, details }) {
  requireSupabase();

  const trimmedReason = reason.trim();
  const trimmedDetails = details.trim().slice(0, 500);

  if (!isAllowedReportReason(trimmedReason)) {
    throw new Error("Choose a report reason.");
  }

  if (trimmedReason === "Something else" && !trimmedDetails) {
    throw new Error("Add a short note about what's wrong.");
  }

  const { error } = await supabase.from("idea_reports").insert({
    idea_id: ideaId,
    reason: trimmedReason,
    details: trimmedDetails,
  });

  if (!error) {
    return;
  }

  if (error.code === "23505" || /duplicate key/i.test(error.message || "")) {
    return;
  }

  if (isMissingReportsTable(error)) {
    throw new Error(SETUP_MESSAGE);
  }

  throw new Error(error.message);
}
