import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

import {
    fetchConversations,
    fetchMessages,
    sendMessage
} from "./services/messagesApi";

function Messages() {
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        async function loadConversations() {
            try {
                const data = await fetchConversations();
                setConversations(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        loadConversations();
    }, []);

    async function selectConversation(conversation) {
        setSelectedConversation(conversation);

        try {
            const data = await fetchMessages(conversation.id);
            setMessages(data || []);
        } catch (error) {
            console.error(error);
        }
    }

    function getOtherUser(conversation) {
        if (conversation.user1_id === user.id) {
            return conversation.user2;
        }

        if (conversation.user2_id === user.id) {
            return conversation.user1;
        }

        return conversation.user1;
    }

    async function handleSendMessage() {
    if (!newMessage.trim()) {
        return;
    }

    if (!selectedConversation) {
        return;
    }

    try {
        const data = await sendMessage(
            selectedConversation.id,
            user.id,
            newMessage
        );

        setMessages([...messages, data[0]]);
        setNewMessage("");
    } catch (error) {
        console.error("Could not send message:", error);
    }
}

    return (
        <div className="messages">
            <h1>Messages</h1>

            <p className="page-intro">
                Conversations with potential collaborators.
            </p>

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
                                const otherUser = getOtherUser(conversation);

                                return (
                                    <button className="conversation-button" 
                                        key={conversation.id}
                                        onClick={() => selectConversation(conversation)}
                                    >
                                        {otherUser?.display_name || "Unknown user"}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="chat-area">

                        {selectedConversation === null ? (
                            <p>Select a conversation to view messages.</p>
                        ) : (
                            <>
                                <h2>
                                    {getOtherUser(selectedConversation)?.display_name}
                                </h2>

                                {messages.length === 0 ? (
                                    <p>No messages yet.</p>
                                ) : (
                                    messages.map((message) => (
                                        <div key={message.id}>
                                            <p>{message.content}</p>
                                        </div>
                                    ))
                                )}

                                <div className="message-input">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(event) =>
                                            setNewMessage(event.target.value)
                                        }
                                        placeholder="Type a message..."
                                    />

                                    <button onClick={handleSendMessage}>
                                        Send
                                    </button>
                                </div>
                            </>
                        )}

                    </div>

                </div>
            )}
        </div>
    );
}

export default Messages;