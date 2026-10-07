import { supabase } from "../supabaseClient";

export async function sendMessage(conversationId, senderId, content) {
    const { data, error } = await supabase
        .from("messages")
        .insert([
            {
                conversation_id: conversationId,
                sender_id: senderId,
                content: content,
            },
        ])
        .select();


    return data;
}

export function subscribeToMessages(conversationId, onMessageReceived) {
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
            (payload) => {
                onMessageReceived(payload.new);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

export async function fetchConversations() {
    const { data: conversations, error: conversationError } = await supabase
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false });


    const userIds = [
        ...new Set(
            conversations.flatMap((conversation) => [
                conversation.user1_id,
                conversation.user2_id
            ])
        )
    ];


    const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);


    if (profileError) {
        throw profileError;
    }

    return conversations.map((conversation) => {
        const user1 = profiles.find(
            (profile) => profile.id === conversation.user1_id
        );

        const user2 = profiles.find(
            (profile) => profile.id === conversation.user2_id
        );


        return {
            ...conversation,
            user1,
            user2
        };
    });
}

export async function fetchMessages(conversationId) {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });


    return data;
}