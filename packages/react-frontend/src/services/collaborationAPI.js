
import { supabase } from "../supabaseClient";


export async function sendCollaborationRequest(idea) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("You must be signed in.");
  }

  if (!idea?.id || !idea?.user_id) {
    throw new Error(
      "This idea is missing required information."
    );
  }

  if (idea.user_id === user.id) {
    throw new Error(
      "You cannot request collaboration on your own idea."
    );
  }

  const { data: requestId, error } = await supabase.rpc(
    "resend_collaboration_request",
    {
      p_idea_id: idea.id,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: requestId,
    status: "pending",
  };
}



export async function fetchIncomingCollaborationRequests(userId) {
  if (!userId) return [];

  const { data: requests, error } = await supabase
    .from("collaboration_requests")
    .select("id, idea_id, requester_id, status, created_at")
    .eq("owner_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!requests?.length) return [];

  const ideaIds = [...new Set(requests.map((r) => r.idea_id))];
  const requesterIds = [
    ...new Set(requests.map((r) => r.requester_id)),
  ];

  const [ideasResult, profilesResult] = await Promise.all([
    supabase
      .from("ideas")
      .select("id, title")
      .in("id", ideaIds),
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", requesterIds),
  ]);

  if (ideasResult.error) {
    throw new Error(ideasResult.error.message);
  }

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }
  console.log("Requester IDs:", requesterIds);
  console.log("Profiles returned:", profilesResult.data);

  return requests.map((request) => ({
    ...request,
    ideaTitle:
      ideasResult.data?.find((idea) => idea.id === request.idea_id)
        ?.title || "Untitled idea",
    requesterName:
      profilesResult.data?.find(
        (profile) => profile.id === request.requester_id
      )?.display_name || "A member",
  }));
}


export async function respondToCollaborationRequest(
  requestId,
  accept
) {
  const { data, error } = await supabase.rpc(
    "respond_to_collaboration_request",
    {
      p_request_id: requestId,
      p_accept: accept,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  // On acceptance: returns the conversation ID.
  // On denial: returns null.
  return data;
}

export async function resendCollaborationRequest(ideaId) {
  const { data, error } = await supabase.rpc(
    "resend_collaboration_request",
    {
      p_idea_id: ideaId,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


export async function fetchMyCollaborationRequest(ideaId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user || !ideaId) return null;

  const { data, error } = await supabase
    .from("collaboration_requests")
    .select("id, status")
    .eq("idea_id", ideaId)
    .eq("requester_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}


export async function alreadyHasConversation(otherUserId) {
  if (!supabase || !otherUserId) return false;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user || user.id === otherUserId) return false;

  // Find the current user's conversation memberships.
  const { data: myMemberships, error: myError } =
    await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

  if (myError) throw myError;
  if (!myMemberships?.length) return false;

  const conversationIds = [
    ...new Set(myMemberships.map((m) => m.conversation_id)),
  ];

  // Check whether the other person belongs to any of them.
  const { data: sharedMemberships, error: sharedError } =
    await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", conversationIds);

  if (sharedError) throw sharedError;
  if (!sharedMemberships?.length) return false;

  const sharedIds = sharedMemberships.map(
    (m) => m.conversation_id
  );

  // Only direct conversations count, not group conversations.
  const { data: directConversations, error: directError } =
    await supabase
      .from("conversations")
      .select("id")
      .eq("type", "direct")
      .in("id", sharedIds)
      .limit(1);

  if (directError) throw directError;

  return (directConversations?.length ?? 0) > 0;
}


