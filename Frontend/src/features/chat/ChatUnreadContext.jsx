import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AuthContext } from '../../core/auth/AuthContext';
import { useSocket } from '../../core/providers/SocketContext';
import { chatApi } from '../../shared/services/chatApi';
import { toast } from 'react-toastify';
import { sameId } from './chatUtils';

const ChatUnreadContext = createContext({
  unread: 0,
  refresh: () => {},
  setUnread: () => {},
  subscribeChatEvents: () => () => {},
});

export function ChatUnreadProvider({ children }) {
  const { user } = useContext(AuthContext);
  const socketCtx = useSocket();
  const socket = socketCtx?.socket ?? null;
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const myId = user?.user_id;
  const subscribersRef = useRef(new Set());

  const parseUnread = (res) =>
    res?.global_unread ??
    res?.unreadCount ??
    res?.data?.global_unread ??
    res?.data?.unreadCount ??
    0;

  const refresh = useCallback(async () => {
    try {
      const res = await chatApi.getUnreadCount();
      setUnread(parseUnread(res));
    } catch {
      /* ignore */
    }
  }, []);

  const subscribeChatEvents = useCallback((handler) => {
    subscribersRef.current.add(handler);
    return () => {
      subscribersRef.current.delete(handler);
    };
  }, []);

  const notify = useCallback((method, ...args) => {
    subscribersRef.current.forEach((h) => {
      h[method]?.(...args);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!socket) return;

    const onUnreadUpdate = (payload) => {
      const count =
        typeof payload?.global_unread === 'number'
          ? payload.global_unread
          : typeof payload?.unreadCount === 'number'
            ? payload.unreadCount
            : null;
      if (count !== null) setUnread(count);
      notify('onUnreadUpdate', payload);
    };

    const onMessage = (msg) => {
      notify('onMessage', msg);

      if (sameId(msg.sender_id, myId)) return;

      refresh();

      if (location.pathname.startsWith('/app/chat')) return;

      toast.info(
        `${msg.sender_name || 'নতুন বার্তা'}: ${(msg.content || msg.message || '').slice(0, 60)}`,
        {
          onClick: () => {
            const q = msg.conversation_id
              ? `?conversationId=${msg.conversation_id}`
              : '';
            navigate(`/app/chat${q}`);
          },
        }
      );
    };

    const onConversationUpdate = (payload) => {
      notify('onConversationUpdate', payload);
    };

    const onNotification = ({ from, preview, conversation_id }) => {
      if (location.pathname.startsWith('/app/chat')) return;

      toast.info(`${from}: ${preview}`, {
        onClick: () => {
          const q = conversation_id ? `?conversationId=${conversation_id}` : '';
          navigate(`/app/chat${q}`);
        },
      });
    };

    const onRead = (payload) => notify('onRead', payload);
    const onDelivered = (payload) => notify('onDelivered', payload);
    const onTyping = (payload) => notify('onTyping', payload);
    const onTypingStart = (payload) => notify('onTypingStart', payload);
    const onTypingStop = (payload) => notify('onTypingStop', payload);
    const onOnline = (payload) => notify('onOnline', payload);
    const onOnlineList = (payload) => notify('onOnlineList', payload);

    socket.on('unread:update', onUnreadUpdate);
    socket.on('message:receive', onMessage);
    socket.on('conversation:update', onConversationUpdate);
    socket.on('chat:notification', onNotification);
    socket.on('chat:read', onRead);
    socket.on('message:read', onRead);
    socket.on('message:delivered', onDelivered);
    socket.on('chat:typing', onTyping);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('chat:online', onOnline);
    socket.on('user:online', onOnline);
    socket.on('user:offline', onOnline);
    socket.on('chat:online_list', onOnlineList);
    socket.on('user:online_list', onOnlineList);

    return () => {
      socket.off('unread:update', onUnreadUpdate);
      socket.off('message:receive', onMessage);
      socket.off('conversation:update', onConversationUpdate);
      socket.off('chat:notification', onNotification);
      socket.off('chat:read', onRead);
      socket.off('message:read', onRead);
      socket.off('message:delivered', onDelivered);
      socket.off('chat:typing', onTyping);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('chat:online', onOnline);
      socket.off('user:online', onOnline);
      socket.off('user:offline', onOnline);
      socket.off('chat:online_list', onOnlineList);
      socket.off('user:online_list', onOnlineList);
    };
  }, [socket, location.pathname, navigate, myId, notify, refresh]);

  return (
    <ChatUnreadContext.Provider
      value={{ unread, refresh, setUnread, subscribeChatEvents }}
    >
      {children}
    </ChatUnreadContext.Provider>
  );
}

export const useChatUnread = () => useContext(ChatUnreadContext);
