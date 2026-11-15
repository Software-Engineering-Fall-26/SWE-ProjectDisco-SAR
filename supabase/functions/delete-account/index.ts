import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-retry-count",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(message: string, status: number) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

async function deleteAvatarFiles(userId: string) {
  const { data: files, error } = await admin.storage
    .from("avatars")
    .list(userId, { limit: 100 });

  throwIfError(error);

  if (!files?.length) {
    return;
  }

  const paths = files.map((file) => `${userId}/${file.name}`);
  const { error: removeError } = await admin.storage.from("avatars").remove(paths);
  throwIfError(removeError);
}

async function deleteEmptyConversations(conversationIds: string[]) {
  for (const conversationId of conversationIds) {
    const { count, error: countError } = await admin
      .from("conversation_members")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    throwIfError(countError);

    if (count !== 0) {
      continue;
    }

    const { error: messagesError } = await admin
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId);
    throwIfError(messagesError);

    const { error: conversationError } = await admin
      .from("conversations")
      .delete()
      .eq("id", conversationId);
    throwIfError(conversationError);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return response("Method not allowed", 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return response("Unauthorized", 401);
  }

  const token = authorization.slice("Bearer ".length);
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    return response("Unauthorized", 401);
  }

  try {
    // Find the user's conversations before removing their memberships.
    const { data: memberships, error: membershipsError } = await admin
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);
    throwIfError(membershipsError);

    const conversationIds = (memberships ?? []).map(
      (membership) => membership.conversation_id,
    );

    // Remove non-cascading account data first. Ideas and profiles are removed
    // automatically when the Auth user is deleted because their foreign keys
    // use ON DELETE CASCADE.
    await deleteAvatarFiles(user.id);

    const cleanupOperations = [
      admin.from("idea_comments").delete().eq("user_id", user.id),
      admin.from("messages").delete().eq("sender_id", user.id),
      admin.from("conversation_members").delete().eq("user_id", user.id),
      admin.from("social_accounts").delete().eq("user_id", user.id),
      admin.from("linkedin_oauth_states").delete().eq("user_id", user.id),
    ];

    const cleanupResults = await Promise.all(cleanupOperations);
    cleanupResults.forEach(({ error }) => throwIfError(error));

    await deleteEmptyConversations(conversationIds);

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    throwIfError(deleteUserError);

    return response("Account deleted", 200);
  } catch (error) {
    console.error("Account deletion failed", error);
    return response("Account deletion could not be completed.", 500);
  }
});
