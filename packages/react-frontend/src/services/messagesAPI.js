import { supabase } from "../supabaseClient";

export async function fetchConversations(userId) {

    if (!userId) return [];

    // 1. Find conversations this user belongs to.
    const { data: myMemberships, error: membershipError } =
        await supabase
            .from("conversation_members")
            .select("conversation_id")
            .eq("user_id", userId);

    if (membershipError) throw membershipError;

    const conversationIds = [
        ...new Set(myMemberships.map((row) => row.conversation_id)),
    ];

    if (conversationIds.length === 0) return [];

    // 2. Fetch those conversations.
    const { data: conversations, error: conversationError } =
        await supabase
            .from("conversations")
            .select("*")
            .in("id", conversationIds)
            .order("created_at", { ascending: false });

    if (conversationError) throw conversationError;

    // 3. Fetch the participants in those conversations.
    const { data: memberships, error: membersError } =
        await supabase
            .from("conversation_members")
            .select("conversation_id, user_id, joined_at")
            .in("conversation_id", conversationIds);


    if (membersError) throw membersError;

    const userIds = [
        ...new Set(memberships.map((member) => member.user_id)),
    ];

    // 4. Fetch the participants' profile information.
    let profiles = [];

    if (userIds.length > 0) {
        const { data, error: profilesError } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds);


        if (profilesError) throw profilesError;
        profiles = data;
    }

    // 5. Return conversations with their participants attached.
    return conversations.map((conversation) => ({
        ...conversation,
        members: memberships
            .filter(
                (member) =>
                    member.conversation_id === conversation.id
            )
            .map((member) => ({
                ...member,
                profile: profiles.find(
                    (profile) => profile.id === member.user_id
                ) ?? null,
            })),
    }));
}

export async function fetchMessages(conversationId) {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return data;
}

export async function sendMessage(
    conversationId,
    senderId,
    content
) {
    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: content.trim(),
        })
        .select()
        .single();

    if (error) throw error;

    return data;
}

export function subscribeToMessages(
    conversationId,
    onMessageReceived
) {
    const channel = supabase
        .channel(`messages-${conversationId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => onMessageReceived(payload.new)
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

export async function fetchUnreadCounts(userId) {
    if (!userId) return {};

    const { data: memberships, error: memberError } =
        await supabase
            .from("conversation_members")
            .select("conversation_id, last_read_at, joined_at")
            .eq("user_id", userId);

    if (memberError) throw memberError;

    const counts = {};

    await Promise.all(
        memberships.map(async (membership) => {
            let query = supabase
                .from("messages")
                .select("id", {
                    count: "exact",
                    head: true,
                })
                .eq("conversation_id", membership.conversation_id)
                .neq("sender_id", userId);

            const since =
                membership.last_read_at ||
                membership.joined_at;

            if (since) {
                query = query.gt("created_at", since);
            }

            const { count, error } = await query;

            if (error) throw error;

            counts[membership.conversation_id] = count || 0;
        })
    );

    return counts;
}

export async function markConversationRead(
    conversationId,
    userId
) {
    const { error } = await supabase
        .from("conversation_members")
        .update({
            last_read_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

    if (error) throw error;
}

export function subscribeToUnreadMessages(
    conversationIds,
    onNewMessage
) {
    if (!conversationIds.length) {
        return () => {};
    }

    const channels = conversationIds.map((conversationId) =>
        supabase
            .channel(`unread-${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                onNewMessage
            )
            .subscribe()
    );

    return () => {
        channels.forEach((channel) => {
            supabase.removeChannel(channel);
        });
    };
}