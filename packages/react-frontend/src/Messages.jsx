import { useEffect, useState } from "react";

import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
    
  if (error) console.error('Error fetching messages:', error);
  return data;
}

async function sendMessage(conversationId, senderId, content) {
  const { error } = await supabase
    .from('messages')
    .insert([{ conversation_id: conversationId, sender_id: senderId, content }]);

  if (error) console.error('Error sending message:', error);
}

function subscribeToMessages(conversationId, onMessageReceived) {
  const channel = supabase
    .channel(`public:messages:conversation_id=eq.${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        // Run code to append the incoming message to your UI
        onMessageReceived(payload.new);
      }
    )
    .subscribe();

  // Clean up subscription when leaving the chat room
  return () => {
    supabase.removeChannel(channel);
  };
}

function Messages() {
    return;
}

export default Messages;