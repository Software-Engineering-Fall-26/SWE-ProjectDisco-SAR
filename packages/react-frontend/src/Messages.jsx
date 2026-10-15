import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

import {
    fetchConversations,
    fetchMessages,
    sendMessage,
} from "./services/messagesApi";

function Messages() {
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedConversation, setSelectedConversation] =
        useState(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        
        let cancelled = false; 

        async function loadConversations() {
            setLoading(true);

            try {
                console.log("Logged in user:", user.id);

                const data = await fetchConversations(user.id);

                console.log("Fetched conversations:", data);

                if (!cancelled) {
                    setConversations(data || []);
                }
            } catch (error) {
                console.error("Error fetching conversations:", error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadConversations();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    async function selectConversation(conversation) {
        setSelectedConversation(conversation);
        setMessages([]);
        setNewMessage("");
        setErrorMessage("");

        try {
            const data = await fetchMessages(conversation.id);
            setMessages(data);
        } catch (error) {
            console.error("Could not load messages:", error);
            setErrorMessage("Could not load messages.");
        }
    }

    function getOtherUser(conversation) {
        return (
            conversation?.members?.find(
                (member) => member.user_id !== user?.id
            )?.profile ?? null
        );
    }

    async function handleSendMessage(event) {
        event?.preventDefault();

        const content = newMessage.trim();

        if (
            !content ||
            !selectedConversation ||
            !user?.id ||
            sending
        ) {
            return;
        }

        setSending(true);
        setErrorMessage("");

        try {
            const message = await sendMessage(
                selectedConversation.id,
                user.id,
                content
            );

            setMessages((current) => [...current, message]);
            setNewMessage("");
        } catch (error) {
            console.error("Could not send message:", error);
            setErrorMessage("Could not send your message. Please try again.");
        } finally {
            setSending(false);
        }
    }

    if (!user) {
        return <p>Please log in to view your messages.</p>;
    }

    return (
        <div className="messages">
            <h1>Messages</h1>

            <p className="page-intro">
                Conversations with potential collaborators.
            </p>

            {errorMessage && (
                <p className="error-message" role="alert">
                    {errorMessage}
                </p>
            )}

            {loading ? (
                <p>Loading conversations...</p>
            ) : (
                <div className="messages-layout">
                    <div className="conversation-list">
                        <h2>Conversations</h2>

                        {conversations.length === 0 ? (
                            <p>No conversations yet.</p>
                        ) : (
                            conversations.map((conversation) => {
                                const otherUser =
                                    getOtherUser(conversation);

                                return (
                                    <button
                                        type="button"
                                        className="conversation-button"
                                        key={conversation.id}
                                        onClick={() =>
                                            selectConversation(conversation)
                                        }
                                    >
                                        {otherUser?.display_name ??
                                            conversation.title ??
                                            "Unknown user"}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="chat-area">
                        {!selectedConversation ? (
                            <p>
                                Select a conversation to view messages.
                            </p>
                        ) : (
                            <>
                                <h2>
                                    {getOtherUser(selectedConversation)
                                        ?.display_name ??
                                        selectedConversation.title ??
                                        "Conversation"}
                                </h2>

                                {messages.length === 0 ? (
                                    <p>No messages yet.</p>
                                ) : (
                                    messages.map((message) => (
                                        <div key={message.id}>
                                            <p>
                                                {message.sender_id === user.id
                                                    ? "You"
                                                    : getOtherUser(
                                                        selectedConversation
                                                    )?.display_name ??
                                                      "Other user"}
                                                : {message.content}
                                            </p>
                                        </div>
                                    ))
                                )}

                                <form
                                    className="message-input"
                                    onSubmit={handleSendMessage}
                                >
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(event) =>
                                            setNewMessage(event.target.value)
                                        }
                                        placeholder="Type a message..."
                                        aria-label="Type a message"
                                        disabled={sending}
                                    />

                                    <button
                                        type="submit"
                                        disabled={
                                            sending || !newMessage.trim()
                                        }
                                    >
                                        {sending ? "Sending..." : "Send"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Messages;
