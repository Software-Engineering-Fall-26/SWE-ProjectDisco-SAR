const BROWSER_NOTIFICATIONS_KEY = "disco-browser-notifications-enabled";

function isSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationState() {
  if (!isSupported()) {
    return { supported: false, enabled: false, permission: "unsupported" };
  }

  return {
    supported: true,
    enabled:
      window.localStorage.getItem(BROWSER_NOTIFICATIONS_KEY) === "true" &&
      Notification.permission === "granted",
    permission: Notification.permission,
  };
}

export async function enableBrowserNotifications() {
  if (!isSupported()) {
    return getBrowserNotificationState();
  }

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

  if (permission === "granted") {
    window.localStorage.setItem(BROWSER_NOTIFICATIONS_KEY, "true");
  }

  return getBrowserNotificationState();
}

export function disableBrowserNotifications() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(BROWSER_NOTIFICATIONS_KEY);
  }

  return getBrowserNotificationState();
}

export function showBrowserNotification({ title, body, tag }) {
  const notificationState = getBrowserNotificationState();

  if (
    !notificationState.enabled ||
    document.visibilityState === "visible"
  ) {
    return;
  }

  const notification = new Notification(title, {
    body: body.slice(0, 140),
    tag,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export function showBrowserMessageNotification(message) {
  if (!message?.content) {
    return;
  }

  showBrowserNotification({
    title: "New Disco message",
    body: message.content,
    tag: "disco-new-message",
  });
}
