import { supabase } from "../supabaseClient";

export async function deleteCurrentAccount() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("Please sign in again before deleting your account.");
  }

  const { error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(error.message || "Could not delete your account.");
  }

  // Removing the local session ensures this browser immediately returns to login.
  await supabase.auth.signOut({ scope: "local" });
}
