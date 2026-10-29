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
    let channels = [];
    let refreshVersion = 0;

    async function refreshUnreadStatus() {
      const version = ++refreshVersion;

      try {
        const counts = await fetchUnreadCounts(user.id);
        console.log("Unread counts:", counts);

        if (!active || version !== refreshVersion) return;

        const hasUnread = Object.values(counts).some(
          (count) => count > 0
        );

        console.log("Setting blue dot visibility to:", hasUnread);

        setHasUnreadMessages(hasUnread);
      } catch (error) {
        console.error("Unread status error:", error);
      }
    }

    async function initializeNotifications() {
      try {
        const { data: memberships, error } = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("user_id", user.id);

        if (error) throw error;
        if (!active) return;

        // Listen to new messages in every conversation.
        for (const membership of memberships || []) {
          const conversationId = membership.conversation_id;

          const channel = supabase
            .channel(`sidebar-messages-${user.id}-${conversationId}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `conversation_id=eq.${conversationId}`,
              },
              (payload) => {
                if (payload.new.sender_id !== user.id) {
                  refreshUnreadStatus();
                }
              }
            )
            .subscribe((status) => {
              if (status === "SUBSCRIBED") {
                refreshUnreadStatus();
              }
            });

          channels.push(channel);
        }

        // Listen for read-status changes.
        const readChannel = supabase
          .channel(`sidebar-read-status-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "conversation_members",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("Read status updated:", payload);
              refreshUnreadStatus();
            }
          )
          .subscribe((status) => {
            console.log("Read channel status:", status);

            if (status === "SUBSCRIBED") {
              refreshUnreadStatus();
            }
          });

        channels.push(readChannel);

        refreshUnreadStatus();
      } catch (error) {
        console.error("Notification setup error:", error);
      }
    }

    // Immediately refresh when the user reads messages
    // in this browser tab.
    window.addEventListener(
      "disco:messages-read",
      refreshUnreadStatus
    );

    // Refresh when returning to the browser tab.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshUnreadStatus();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    initializeNotifications();

    return () => {
      active = false;

      window.removeEventListener(
        "disco:messages-read",
        refreshUnreadStatus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
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
