
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import "./pages.css";
import {
    fetchConversations,
    fetchMessages,
    sendMessage,
    subscribeToMessages,
} from "./services/messagesAPI";

function Messages() {
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    const bottomRef = useRef(null);
    const requestRef = useRef(0);

    function getOtherUser(conversation) {
        return conversation.members?.find(
            (member) => member.user_id !== user?.id
        )?.profile ?? null;
    }

    function getName(conversation) {
        return getOtherUser(conversation)?.display_name ||
            conversation.title ||
            "Unknown user";
    }

    function formatTime(date) {
        if (!date) return "";

        return new Date(date).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }

    function formatDate(date) {
        return new Date(date).toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    useEffect(() => {
        let cancelled = false;

        async function loadConversations() {
            if (!user?.id) {
                setConversations([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const data = await fetchConversations(user.id);
                if (!cancelled) setConversations(data || []);
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setError("Unable to load conversations.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadConversations();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    useEffect(() => {
        if (!selectedConversation?.id) return;

        const conversationId = selectedConversation.id;
        const requestId = ++requestRef.current;
        let active = true;
        let pendingMessages = [];

        setMessages([]);
        setLoadingMessages(true);
        setError("");

        // Subscribe before fetching so messages arriving
        // during the fetch aren't lost.
        const unsubscribe = subscribeToMessages(
            conversationId,
            (message) => {
                if (!active) return;

                if (pendingMessages !== null) {
                    pendingMessages.push(message);
                } else {
                    setMessages((current) =>
                        current.some((m) => m.id === message.id)
                            ? current
                            : [...current, message]
                    );
                }
            }
        );

        async function loadMessages() {
            try {
                const data = await fetchMessages(conversationId);

                if (!active || requestId !== requestRef.current) return;

                const combined = [...(data || []), ...pendingMessages];
                const unique = Array.from(
                    new Map(combined.map((m) => [m.id, m])).values()
                );

                unique.sort(
                    (a, b) =>
                        new Date(a.created_at) -
                        new Date(b.created_at)
                );

                pendingMessages = null;
                setMessages(unique);
            } catch (err) {
                console.error(err);
                if (active) setError("Unable to load messages.");
            } finally {
                if (active) setLoadingMessages(false);
            }
        }

        loadMessages();

        return () => {
            active = false;
            unsubscribe();
        };
    }, [selectedConversation?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages]);

    async function handleSendMessage(event) {
        event.preventDefault();

        const content = newMessage.trim();

        if (!content || !selectedConversation || !user?.id || sending) {
            return;
        }

        const conversationId = selectedConversation.id;

        setSending(true);
        setError("");

        try {
            const message = await sendMessage(
                conversationId,
                user.id,
                content
            );

            if (message) {
                setMessages((current) =>
                    current.some((m) => m.id === message.id)
                        ? current
                        : [...current, message]
                );
            }

            setNewMessage("");
        } catch (err) {
            console.error(err);
            setError("Could not send your message.");
        } finally {
            setSending(false);
        }
    }

    const filteredConversations = conversations.filter(
        (conversation) =>
            getName(conversation)
                .toLowerCase()
                .includes(search.toLowerCase())
    );

    if (!user) {
        return <p>Please log in to view messages.</p>;
    }

    return (
        <div className="messages-page">
            <div className="messages-page-heading">
                <div>
                    <p className="page-kicker">YOUR INBOX</p>
                    <h1>Messages</h1>
                    <p className="page-intro">
                        Connect and collaborate with other members.
                    </p>
                </div>
            </div>

            <div className="messages-layout">
                <aside className="conversation-list">
                    <div className="conversation-list-header">
                        <div className="conversation-title-row">
                            <h2>Conversations</h2>
                            <span className="conversation-count">
                                {conversations.length}
                            </span>
                        </div>

                        <input
                            className="conversation-search"
                            type="search"
                            placeholder="Search conversations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="conversation-items">
                        {loading ? (
                            <p className="messages-placeholder">
                                Loading conversations...
                            </p>
                        ) : filteredConversations.length === 0 ? (
                            <div className="messages-empty">
                                <p>
                                    {search
                                        ? "No matching conversations."
                                        : "No conversations yet."}
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map((conversation) => {
                                const name = getName(conversation);
                                const active =
                                    selectedConversation?.id ===
                                    conversation.id;

                                return (
                                    <button
                                        key={conversation.id}
                                        type="button"
                                        className={`conversation-item ${
                                            active ? "active" : ""
                                        }`}
                                        onClick={() => {
                                            setSelectedConversation(conversation);
                                            setNewMessage("");
                                        }}
                                    >
                                        <div className="conversation-avatar">
                                            {name.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="conversation-info">
                                            <strong>{name}</strong>
                                            <span>
                                                {conversation.type === "group"
                                                    ? "Group conversation"
                                                    : "Direct message"}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                <section className="chat-area">
                    {!selectedConversation ? (
                        <div className="chat-welcome">
                            <div className="chat-welcome-icon">✉</div>
                            <h2>Your messages</h2>
                            <p>
                                Select a conversation to start chatting
                                with a potential collaborator.
                            </p>
                        </div>
                    ) : (
                        <>
                            <header className="chat-header">
                                <div className="conversation-avatar">
                                    {getName(selectedConversation)
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <h2>{getName(selectedConversation)}</h2>
                                    <span>
                                        {selectedConversation.type === "group"
                                            ? "Group conversation"
                                            : "Direct conversation"}
                                    </span>
                                </div>
                            </header>

                            <div className="chat-messages">
                                {loadingMessages ? (
                                    <p className="messages-placeholder">
                                        Loading messages...
                                    </p>
                                ) : messages.length === 0 ? (
                                    <div className="chat-empty">
                                        <p>No messages yet.</p>
                                        <span>
                                            Say hello and start the conversation!
                                        </span>
                                    </div>
                                ) : (
                                    messages.map((message, index) => {
                                        const mine =
                                            message.sender_id === user.id;

                                        const previous = messages[index - 1];

                                        const showDate =
                                            !previous ||
                                            new Date(previous.created_at)
                                                .toDateString() !==
                                            new Date(message.created_at)
                                                .toDateString();

                                        return (
                                            <div key={message.id}>
                                                {showDate && (
                                                    <div className="message-date">
                                                        {formatDate(
                                                            message.created_at
                                                        )}
                                                    </div>
                                                )}

                                                <div
                                                    className={`message-row ${
                                                        mine
                                                            ? "message-mine"
                                                            : "message-theirs"
                                                    }`}
                                                >
                                                    <div className="message-bubble">
                                                        <p>{message.content}</p>
                                                        <span className="message-time">
                                                            {formatTime(
                                                                message.created_at
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                <div ref={bottomRef} />
                            </div>

                            {error && (
                                <p className="chat-error" role="alert">
                                    {error}
                                </p>
                            )}

                            <form
                                className="message-composer"
                                onSubmit={handleSendMessage}
                            >
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) =>
                                        setNewMessage(e.target.value)
                                    }
                                    placeholder="Write a message..."
                                    aria-label="Write a message"
                                    disabled={sending}
                                />

                                <button
                                    type="submit"
                                    disabled={
                                        sending || !newMessage.trim()
                                    }
                                >
                                    {sending ? "Sending..." : "Send →"}
                                </button>
                            </form>
                        </>
                    )}
                </section>
            </div>

            {!selectedConversation && error && (
                <p className="error-message" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

export default Messages;
