import { Routes, Route, NavLink, Outlet, Navigate } from "react-router-dom";

import { useAuth } from "./useAuth";
import Login from "./Login";
import Ideas from "./Ideas";
import IdeaBoard from "./IdeaBoard";
import Profile from "./Profile";
import ResetPassword from "./ResetPassword";
import Messages from "./Messages";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { fetchUnreadCounts } from "./services/messagesAPI";

function AppLayout() {
  const { user } = useAuth();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setHasUnreadMessages(false);
      return;
    }

    let active = true;
    let channel;

    async function refreshUnreadStatus() {
      try {
        const counts = await fetchUnreadCounts(user.id);

        if (active) {
          const hasUnread = Object.values(counts).some(
            (count) => count > 0
          );

          setHasUnreadMessages(hasUnread);
        }
      } catch (error) {
        console.error("Error checking unread messages:", error);
      }
    }

    async function initializeNotifications() {
      // Get conversations this user belongs to
      const { data: memberships, error } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error loading memberships:", error);
        return;
      }

      if (!active) return;

      const conversationIds = new Set(
        (memberships || []).map((m) => m.conversation_id)
      );

      // Listen for new messages and changes to read status
      channel = supabase
        .channel(`sidebar-unread-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            if (
              conversationIds.has(payload.new.conversation_id) &&
              payload.new.sender_id !== user.id
            ) {
              refreshUnreadStatus();
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "conversation_members",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            refreshUnreadStatus();
          }
        )
        .subscribe();

      refreshUnreadStatus();
    }

    initializeNotifications();

    return () => {
      active = false;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>

          <span className="brand-copy">
            <span className="brand-name">Disco</span>
            <span className="brand-tag">Idea studio</span>
          </span>
        </div>

        <div className="sidebar-nav">
          <NavLink to="/ideas" className="sidebar-link">
            Ideas
          </NavLink>

          <NavLink to="/board" className="sidebar-link">
            Idea Board
          </NavLink>
        </div>

        <NavLink to="/messages" className="sidebar-link">
          <span>Messages</span>

          {hasUnreadMessages && (
            <span
              className="sidebar-unread-dot"
              aria-label="Unread messages"
            />
          )}
        </NavLink>

        <NavLink
          to="/profile"
          className="sidebar-link account-link"
        >
          Account
        </NavLink>
      </nav>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="boot-screen">
        <span className="brand-mark" aria-hidden="true">
          D
        </span>
        <p>Loading Disco</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function MyApp() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/ideas" element={<Ideas />} />
        <Route path="/board" element={<IdeaBoard />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default MyApp;
