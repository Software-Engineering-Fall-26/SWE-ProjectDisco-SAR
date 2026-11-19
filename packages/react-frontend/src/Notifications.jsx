import { useEffect, useState } from "react";

import { useAuth } from "./useAuth";
import { supabase } from "./supabaseClient";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  fetchNotifications,
  fetchNotificationPreferences,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotificationPreferences,
} from "./services/notificationsApi";

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function notificationTitle(type) {
  if (type === "idea_like") return "Your idea received a like";
  if (type === "idea_comment") return "New comment on your idea";
  if (type === "collaboration_request") return "New collaboration request";
  return "New notification";
}

function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [preferences, setPreferences] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    if (!user?.id) return undefined;

    let active = true;

    async function loadNotifications() {
      setLoading(true);
      setError("");

      try {
        const [items, savedPreferences] = await Promise.all([
          fetchNotifications(user.id),
          fetchNotificationPreferences(user.id),
        ]);
        if (active) {
          setNotifications(items);
          setPreferences(savedPreferences);
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNotifications();

    const channel = supabase
      .channel(`notification-center-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        loadNotifications,
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function handleMarkRead(notificationId) {
    try {
      await markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? { ...item, read_at: new Date().toISOString() }
            : item,
        ),
      );
    } catch (markError) {
      setError(markError.message);
    }
  }

  async function handleMarkAllRead() {
    if (!user?.id) return;

    setMarkingAll(true);
    setError("");

    try {
      await markAllNotificationsRead(user.id);
      const now = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) => ({ ...item, read_at: item.read_at || now })),
      );
    } catch (markError) {
      setError(markError.message);
    } finally {
      setMarkingAll(false);
    }
  }

  async function handlePreferenceChange(event) {
    const { name, checked } = event.target;
    const nextPreferences = { ...preferences, [name]: checked };

    setPreferences(nextPreferences);
    setSavingPreferences(true);
    setError("");

    try {
      await saveNotificationPreferences(user.id, nextPreferences);
    } catch (saveError) {
      setPreferences(preferences);
      setError(saveError.message);
    } finally {
      setSavingPreferences(false);
    }
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <div className="notifications-page">
      <header className="page-header">
        <p className="page-kicker">Activity</p>
        <h1>Notifications</h1>
        <p className="page-intro">
          Keep track of likes, comments, and collaboration requests for your ideas.
        </p>
      </header>

      <div className="notifications-toolbar">
        <span>{unreadCount} unread</span>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleMarkAllRead}
          disabled={markingAll || unreadCount === 0}
        >
          {markingAll ? "Marking..." : "Mark all as read"}
        </button>
      </div>

      <section className="notification-settings" aria-labelledby="notification-settings-title">
        <div>
          <h2 id="notification-settings-title">Notification settings</h2>
          <p>Choose which activity you want to receive notifications for.</p>
        </div>
        <label>
          <input
            type="checkbox"
            name="idea_like"
            checked={preferences.idea_like}
            onChange={handlePreferenceChange}
            disabled={savingPreferences}
          />
          Likes on my ideas
        </label>
        <label>
          <input
            type="checkbox"
            name="idea_comment"
            checked={preferences.idea_comment}
            onChange={handlePreferenceChange}
            disabled={savingPreferences}
          />
          Comments on my ideas
        </label>
        <label>
          <input
            type="checkbox"
            name="collaboration_request"
            checked={preferences.collaboration_request}
            onChange={handlePreferenceChange}
            disabled={savingPreferences}
          />
          Collaboration requests
        </label>
      </section>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p className="empty-state">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="empty-state">You have no notifications yet.</p>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={
                notification.read_at
                  ? "notification-item"
                  : "notification-item unread"
              }
            >
              <div>
                <h2>{notificationTitle(notification.type)}</h2>
                <p>{notification.message}</p>
                <time dateTime={notification.created_at}>
                  {formatDate(notification.created_at)}
                </time>
              </div>
              {!notification.read_at && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleMarkRead(notification.id)}
                >
                  Mark as read
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
