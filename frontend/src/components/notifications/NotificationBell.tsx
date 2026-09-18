import { useEffect, useState } from "react";
import api from "../../lib/api/apiClient";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const formatTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString();
};

const BellIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
  </svg>
);

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const loadNotifications = async () => {
    try {
      const response = await api.get<NotificationItem[]>(
        "/notifications"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  useEffect(() => {
    loadNotifications();

    const interval = window.setInterval(
      loadNotifications,
      30000
    );

    return () => window.clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      setLoading(true);

      await api.put(`/notifications/${id}/read`);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setLoading(true);

      await api.put("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50"
      >
        <BellIcon />

        {unreadCount > 0 && (
          <>
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-[8px] font-bold leading-4 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[100] w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Notifications
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                disabled={loading}
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <BellIcon />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  New system activity will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  className={`flex w-full gap-3 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                    notification.isRead
                      ? "bg-white"
                      : "bg-blue-50/60"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      notification.isRead
                        ? "bg-slate-200"
                        : "bg-blue-600"
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-800">
                      {notification.title}
                    </span>

                    <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                      {notification.message}
                    </span>

                    <span className="mt-1.5 block text-[9px] font-medium text-slate-400">
                      {formatTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
