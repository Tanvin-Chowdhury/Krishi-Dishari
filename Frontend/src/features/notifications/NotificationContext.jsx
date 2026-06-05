import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuctionSocket } from '../../core/providers/AuctionSocketContext';
import { AuthContext } from '../../core/auth/AuthContext';
import { notificationApi } from '../../shared/services/notificationApi';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refresh: () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  remove: async () => {},
});

function belongsToUser(notification, userId) {
  if (!userId) return false;
  const nid = notification?.user_id ?? notification?.userId;
  return Number(nid) === Number(userId);
}

export function NotificationProvider({ children }) {
  const { user } = useContext(AuthContext);
  const { socket, isConnected } = useAuctionSocket() ?? {};
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const userId = user?.user_id;

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    try {
      const [listRes, countRes] = await Promise.all([
        notificationApi.list({ limit: 15 }),
        notificationApi.getUnreadCount(),
      ]);
      const list = (listRes.notifications || listRes.data?.notifications || []).filter(
        (n) => belongsToUser(n, userId)
      );
      setNotifications(list);
      setUnreadCount(
        countRes.count ??
          countRes.unread_count ??
          countRes.data?.count ??
          countRes.data?.unread_count ??
          0
      );
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userId]);

  useEffect(() => {
    if (!socket || !isConnected || !userId) return;

    const onNew = (n) => {
      if (!belongsToUser(n, userId)) return;
      setNotifications((prev) => {
        const id = n.notification_id ?? n.id;
        if (prev.some((x) => (x.notification_id ?? x.id) === id)) return prev;
        return [n, ...prev].slice(0, 20);
      });
      if (!n.is_read) setUnreadCount((c) => c + 1);
    };

    const onUpdated = (n) => {
      if (!belongsToUser(n, userId)) return;
      setNotifications((prev) =>
        prev.map((x) =>
          (x.notification_id ?? x.id) === (n.notification_id ?? n.id) ? n : x
        )
      );
    };

    const onDeleted = ({ notification_id, id }) => {
      const nid = notification_id ?? id;
      setNotifications((prev) =>
        prev.filter((x) => (x.notification_id ?? x.id) !== nid)
      );
    };

    const onCount = ({ count, unread_count }) => {
      setUnreadCount(count ?? unread_count ?? 0);
    };

    socket.on('notification:new', onNew);
    socket.on('notification', onNew);
    socket.on('notification:updated', onUpdated);
    socket.on('notification:deleted', onDeleted);
    socket.on('notification:count', onCount);

    return () => {
      socket.off('notification:new', onNew);
      socket.off('notification', onNew);
      socket.off('notification:updated', onUpdated);
      socket.off('notification:deleted', onDeleted);
      socket.off('notification:count', onCount);
    };
  }, [socket, isConnected, userId]);

  const markRead = useCallback(async (id) => {
    const res = await notificationApi.markRead(id);
    const n = res.notification || res.data?.notification;
    if (n) {
      setNotifications((prev) =>
        prev.map((x) =>
          (x.notification_id ?? x.id) === (n.notification_id ?? n.id) ? n : x
        )
      );
    }
    setUnreadCount((c) => Math.max(0, c - 1));
    await refresh();
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnreadCount(0);
  }, []);

  const remove = useCallback(async (id) => {
    await notificationApi.remove(id);
    setNotifications((prev) =>
      prev.filter((x) => (x.notification_id ?? x.id) !== id)
    );
    await refresh();
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refresh,
        markRead,
        markAllRead,
        remove,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
