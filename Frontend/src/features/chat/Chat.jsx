import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import {
  Send, Search, MessageSquare, CheckCheck, Check, ArrowLeft,
  Plus, Pencil, Users, ShoppingBag, Gavel, HardHat,
  Phone, MoreVertical, User, Filter, Mic, Paperclip, Smile,
} from 'lucide-react';
import { AuthContext }      from '../../core/auth/AuthContext';
import { useSocket }        from '../../core/providers/SocketContext';
import { chatApi }          from '../../shared/services/chatApi';
import { toast }            from 'react-toastify';
import { useChatUnread }    from './ChatUnreadContext';
import { Skeleton }         from '../../shared/design-system/Skeleton';
import UserPhoto            from '../../shared/components/UserPhoto';
import { cn }               from '../../shared/lib/cn';
import { sameId, upsertMessage, mergeConversation, normalizeConversation } from './chatUtils';

/* ─── helpers ─────────────────────────────────────────────── */
function fmtTime(ts) {
  const d   = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)    return 'এখন';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}মি আগে`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}

const ROLE_MAP = {
  farmer:     { label: 'কৃষক',    bg: 'bg-green-100  text-green-700'  },
  consultant: { label: 'বিশেষজ্ঞ', bg: 'bg-blue-100   text-blue-700'   },
  wholesaler: { label: 'পাইকার',   bg: 'bg-purple-100 text-purple-700' },
  labor:      { label: 'শ্রমিক',   bg: 'bg-orange-100 text-orange-700' },
  admin:      { label: 'অ্যাডমিন', bg: 'bg-red-100    text-red-700'    },
};

function RoleBadge({ role }) {
  const key = (role || '').toLowerCase();
  const r   = ROLE_MAP[key];
  if (!r) return null;
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${r.bg}`}>
      {r.label}
    </span>
  );
}

/* ─── Avatar ──────────────────────────────────────────────── */
function ChatAvatar({ name = '?', photo, size = 40, online }) {
  const cls = size >= 44 ? 'h-11 w-11' : 'h-10 w-10';
  return (
    <div className="relative shrink-0">
      <UserPhoto
        src={photo}
        name={name}
        className={cn('rounded-full object-cover', cls)}
        fallbackClassName={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 font-bold text-white',
          cls,
          size >= 44 ? 'text-base' : 'text-sm'
        )}
      />
      {online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  );
}

/* ─── ConversationItem ────────────────────────────────────── */
function ConversationItem({ conv, active, onClick }) {
  const role = conv.other_role ?? conv.other_user_type ?? '';
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 border-l-[3px] px-4 py-3 text-left transition-all',
        active
          ? 'border-emerald-600 bg-emerald-50'
          : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
      )}
    >
      <ChatAvatar name={conv.other_name} photo={conv.other_photo ?? conv.other_user_avatar}
        size={44} online={conv.other_is_online} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn('truncate text-sm text-gray-900',
              conv.unread_count > 0 ? 'font-extrabold' : 'font-semibold')}>
              {conv.other_name}
            </span>
            {role && <RoleBadge role={role} />}
          </div>
          <span className="shrink-0 text-[11px] text-gray-400">
            {conv.last_message_at ? fmtTime(conv.last_message_at) : ''}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={cn('truncate text-xs',
            conv.unread_count > 0 ? 'font-semibold text-gray-700' : 'text-gray-500')}>
            {conv.last_message || 'কোনো বার্তা নেই'}
          </span>
          {conv.unread_count > 0 && (
            <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
              {conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── MessageBubble ───────────────────────────────────────── */
function MessageBubble({ msg, mine }) {
  const status = msg.status || (msg.is_read ? 'read' : 'sent');
  return (
    <div className={cn('flex px-4 mb-1.5', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[72%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
        mine
          ? 'rounded-br-md bg-gradient-to-br from-emerald-600 to-teal-600 text-white'
          : 'rounded-bl-md border border-gray-100 bg-white text-gray-900 shadow'
      )}>
        <p className="break-words leading-relaxed">{msg.content || msg.message}</p>
        <div className={cn(
          'mt-1 flex items-center justify-end gap-1 text-[10px]',
          mine ? 'text-emerald-100' : 'text-gray-400'
        )}>
          <span>{fmtTime(msg.created_at)}</span>
          {mine && (
            status === 'read'      ? <CheckCheck size={12} />
            : status === 'delivered' ? <CheckCheck size={12} className="opacity-60" />
            : <Check size={12} className="opacity-50" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── DateDivider ─────────────────────────────────────────── */
function DateDivider({ date }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex-1 border-t border-gray-200" />
      <span className="rounded-full bg-gray-100 px-3 py-0.5 text-[11px] text-gray-500">{date}</span>
      <div className="flex-1 border-t border-gray-200" />
    </div>
  );
}

/* ─── TypingBubble ────────────────────────────────────────── */
function TypingBubble() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-1">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
        {[0, 150, 300].map(d => (
          <span key={d} className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Conversation skeleton ───────────────────────────────── */
function ConvSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="h-11 w-11 shrink-0 rounded-full bg-gray-100" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-2/3 rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-100" />
      </div>
    </div>
  );
}

/* ─── Filter tabs ─────────────────────────────────────────── */
const FILTER_TABS = [
  { id: 'all',        label: 'সব'       },
  { id: 'unread',     label: 'অপঠিত'    },
  { id: 'consultant', label: 'বিশেষজ্ঞ' },
  { id: 'farmer',     label: 'কৃষক'     },
  { id: 'wholesaler', label: 'পাইকার'   },
  { id: 'labor',      label: 'শ্রমিক'   },
];

/* ─── Welcome / empty right panel ────────────────────────── */
const QUICK_CARDS = [
  { icon: Users,      label: 'বিশেষজ্ঞের পরামর্শ নিন',     sub: 'কৃষি বিশেষজ্ঞের সাথে কথা বলুন',   to: '/app/experts',     from: 'from-emerald-500', to2: 'to-teal-600'    },
  { icon: ShoppingBag,label: 'বিক্রেতার সাথে কথা বলুন',    sub: 'পণ্য ও মূল্য সম্পর্কে জিজ্ঞাসা', to: '/app/marketplace',  from: 'from-blue-500',   to2: 'to-indigo-500'  },
  { icon: Gavel,      label: 'নিলাম বিষয়ে যোগাযোগ',        sub: 'নিলামের জন্য বিক্রেতার সাথে',     to: '/app/auctions',     from: 'from-orange-500', to2: 'to-amber-500'   },
  { icon: HardHat,    label: 'শ্রমিক নিয়োগ আলোচনা',        sub: 'কাজের জন্য শ্রমিক খুঁজুন',        to: '/app/labor',        from: 'from-purple-500', to2: 'to-pink-500'    },
];

function WelcomePane() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 bg-gray-50">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 shadow-inner">
        <MessageSquare size={44} className="text-emerald-600" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-extrabold text-gray-900">একটি কথোপকথন নির্বাচন করুন</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          কৃষক, বিশেষজ্ঞ, পাইকার বা শ্রমিকের সাথে নিরাপদে বার্তা আদান-প্রদান করুন
        </p>
      </div>
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {QUICK_CARDS.map(c => (
          <Link key={c.to} to={c.to}
            className="group flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${c.from} ${c.to2} shadow-sm`}>
              <c.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-gray-800 leading-tight group-hover:text-emerald-700 transition">{c.label}</p>
              <p className="mt-0.5 text-[10px] text-gray-400 leading-tight">{c.sub}</p>
            </div>
          </Link>
        ))}
      </div>
      <p className="text-center text-[11px] text-gray-400">
        আপনার সকল বার্তা এন্ড-টু-এন্ড সুরক্ষিত
      </p>
    </div>
  );
}

/* ─── Empty conversation list ─────────────────────────────── */
function EmptyConvList() {
  return (
    <div className="flex flex-col items-center gap-5 px-5 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
        <MessageSquare size={28} className="text-emerald-500" />
      </div>
      <div>
        <p className="font-extrabold text-gray-700">কোনো কথোপকথন নেই</p>
        <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
          মার্কেটপ্লেস, নিলাম বা বিশেষজ্ঞ তালিকা থেকে<br />যোগাযোগ শুরু করুন
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <Link to="/app/marketplace"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 transition shadow-sm">
          <ShoppingBag size={13} /> মার্কেটপ্লেস
        </Link>
        <Link to="/app/experts"
          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition">
          <Users size={13} /> বিশেষজ্ঞ তালিকা
        </Link>
        <Link to="/app/auctions"
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
          <Gavel size={13} /> লাইভ নিলাম
        </Link>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN CHAT PAGE
════════════════════════════════════════════════════════════ */
export default function Chat() {
  const { user }    = useContext(AuthContext);
  const navigate    = useNavigate();
  const socketCtx   = useSocket();
  const socket      = socketCtx?.socket ?? null;
  const [searchParams] = useSearchParams();
  const myId        = user?.user_id;

  /* ── state (unchanged from original) ── */
  const [conversations, setConversations] = useState([]);
  const [active,        setActive]        = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [search,        setSearch]        = useState('');
  const [filterTab,     setFilterTab]     = useState('all');
  const [loadingList,   setLoadingList]   = useState(true);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const [sending,       setSending]       = useState(false);
  const [typing,        setTyping]        = useState(false);
  const [onlineIds,     setOnlineIds]     = useState(new Set());
  const [mobileView,    setMobileView]    = useState('list');

  const {
    unread: globalUnread,
    refresh: refreshGlobalUnread,
    setUnread: setGlobalUnreadCtx,
    subscribeChatEvents,
  } = useChatUnread();

  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);
  const activeRef   = useRef(null);
  const sendingRef  = useRef(false);
  const inputRef    = useRef(null);

  useEffect(() => { activeRef.current = active; }, [active]);

  /* ── join conversation room on socket ── */
  useEffect(() => {
    if (!socket || !active?.conversation_id) return;
    const join = () => socket.emit('join_conversation', active.conversation_id);
    if (socket.connected) join();
    socket.on('connect', join);
    return () => socket.off('connect', join);
  }, [socket, active?.conversation_id]);

  /* ── load conversations ── */
  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const res  = await chatApi.getConversations();
      const list = (res.conversations || res.data?.conversations || []).map(normalizeConversation);
      setConversations(list);
      const global = res.global_unread ?? res.unreadCount ?? res.data?.global_unread ?? res.data?.unreadCount ?? 0;
      setGlobalUnreadCtx(global);
    } catch {
      toast.error('কথোপকথন লোড করতে সমস্যা');
    } finally {
      setLoadingList(false);
    }
  }, [setGlobalUnreadCtx]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  /* ── deep-link: ?userId=… ── */
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (!userId || loadingList) return;
    (async () => {
      try {
        const res  = await chatApi.createConversation(+userId);
        const conv = normalizeConversation(res.conversation || res.data?.conversation);
        if (conv) {
          setConversations(prev => prev.find(c => c.conversation_id === conv.conversation_id) ? prev : [conv, ...prev]);
          selectConversation(conv);
        }
      } catch (err) { toast.error(err.message); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('userId'), loadingList]);

  /* ── deep-link: ?conversationId=… ── */
  useEffect(() => {
    const cid = searchParams.get('conversationId');
    if (!cid || loadingList) return;
    (async () => {
      try {
        const res  = await chatApi.getConversation(+cid);
        const conv = normalizeConversation(res.conversation || res.data?.conversation);
        if (conv) {
          setConversations(prev => prev.find(c => c.conversation_id === conv.conversation_id) ? prev : [conv, ...prev]);
          selectConversation(conv);
        }
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('conversationId'), loadingList]);

  /* ── socket events ── */
  useEffect(() => {
    return subscribeChatEvents({
      onMessage: (msg) => {
        if (sameId(msg.sender_id, myId)) return;
        const convId  = msg.conversation_id;
        const isActive = sameId(activeRef.current?.conversation_id, convId);
        if (isActive) {
          setMessages(prev => upsertMessage(prev, msg));
          chatApi.markRead(convId).catch(() => {});
        }
        setConversations(prev => prev.map(c =>
          sameId(c.conversation_id, convId)
            ? { ...c, last_message: msg.content || msg.message, last_message_at: msg.created_at, unread_count: isActive ? 0 : (c.unread_count || 0) + 1 }
            : c
        ));
        if (!isActive) refreshGlobalUnread();
      },
      onConversationUpdate: ({ conversation }) => {
        if (!conversation) return;
        setConversations(prev => mergeConversation(prev, normalizeConversation(conversation)));
        if (sameId(activeRef.current?.conversation_id, conversation.conversation_id))
          setActive(prev => prev ? { ...prev, ...conversation } : prev);
      },
      onUnreadUpdate: (payload) => {
        const count = typeof payload?.global_unread === 'number' ? payload.global_unread
          : typeof payload?.unreadCount === 'number' ? payload.unreadCount : null;
        if (count !== null) setGlobalUnreadCtx(count);
        if (payload?.conversationId != null && payload?.conversationUnreadCount != null) {
          setConversations(prev => prev.map(c =>
            sameId(c.conversation_id, payload.conversationId) ? { ...c, unread_count: payload.conversationUnreadCount } : c
          ));
        }
      },
      onRead: ({ conversation_id, reader_id }) => {
        if (sameId(reader_id, myId)) return;
        setMessages(prev => prev.map(m =>
          sameId(m.conversation_id, conversation_id) && sameId(m.sender_id, myId) ? { ...m, status: 'read', is_read: true } : m
        ));
      },
      onDelivered: ({ conversation_id }) => {
        setMessages(prev => prev.map(m =>
          sameId(m.conversation_id, conversation_id) && sameId(m.sender_id, myId) && m.status === 'sent' ? { ...m, status: 'delivered' } : m
        ));
      },
      onTyping: ({ userId, isTyping: t }) => { if (!sameId(userId, myId)) setTyping(!!t); },
      onTypingStart: ({ userId, conversationId }) => {
        if (!sameId(userId, myId) && sameId(activeRef.current?.conversation_id, conversationId)) setTyping(true);
      },
      onTypingStop: ({ userId, conversationId }) => {
        if (!sameId(userId, myId) && sameId(activeRef.current?.conversation_id, conversationId)) setTyping(false);
      },
      onOnline: ({ userId, online }) => {
        setOnlineIds(prev => { const n = new Set(prev); online ? n.add(userId) : n.delete(userId); return n; });
        setConversations(prev => prev.map(c => sameId(c.other_id, userId) ? { ...c, other_is_online: online } : c));
      },
      onOnlineList: ({ onlineUserIds }) => { setOnlineIds(new Set(onlineUserIds || [])); },
    });
  }, [subscribeChatEvents, myId, setGlobalUnreadCtx, refreshGlobalUnread]);

  /* ── select conversation ── */
  const selectConversation = useCallback(async (conv) => {
    if (active?.conversation_id === conv.conversation_id) return;
    if (active && socket) socket.emit('leave_conversation', active.conversation_id);
    setActive(normalizeConversation(conv));
    setMessages([]);
    setMobileView('chat');
    setLoadingMsgs(true);
    setTyping(false);
    try {
      const res = await chatApi.getMessages(conv.conversation_id);
      setMessages(res.messages || res.data?.messages || []);
    } finally {
      setLoadingMsgs(false);
    }
    if (socket) socket.emit('join_conversation', conv.conversation_id);
    await chatApi.markRead(conv.conversation_id);
    setConversations(prev => prev.map(c => c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c));
    setGlobalUnreadCtx(n => Math.max(0, n - (conv.unread_count || 0)));
    refreshGlobalUnread();
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [active, socket]);

  /* ── auto-scroll ── */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ── send message ── */
  const handleSend = async () => {
    const content = text.trim();
    if (!content || !active || sending || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setText('');
    const optimistic = {
      message_id: `opt-${Date.now()}`, content,
      sender_id: myId, sender_name: user?.full_name,
      status: 'sent', created_at: new Date().toISOString(),
      conversation_id: active.conversation_id, _optimistic: true,
    };
    setMessages(prev => upsertMessage(prev, optimistic));
    try {
      const res = await chatApi.sendMessage(active.conversation_id, content);
      const msg = res.message || res.data?.message;
      if (msg) setMessages(prev => upsertMessage(prev, { ...msg, sender_name: user?.full_name }));
      setConversations(prev => prev.map(c =>
        c.conversation_id === active.conversation_id
          ? { ...c, last_message: content, last_message_at: msg?.created_at || new Date().toISOString() }
          : c
      ));
    } catch (err) {
      setMessages(prev => prev.filter(m => !m._optimistic));
      setText(content);
      toast.error(err.message);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  /* ── typing events ── */
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!socket || !active) return;
    socket.emit('typing:start', { conversationId: active.conversation_id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: active.conversation_id });
    }, 1500);
  };

  /* ── filtered conversations ── */
  const filtered = conversations.filter(c => {
    const matchSearch = !search || c.other_name?.toLowerCase().includes(search.toLowerCase());
    const role = (c.other_role ?? c.other_user_type ?? '').toLowerCase();
    const matchTab =
      filterTab === 'all'
      || (filterTab === 'unread' && c.unread_count > 0)
      || role === filterTab;
    return matchSearch && matchTab;
  });

  const activeOnline = active?.other_is_online || onlineIds.has(active?.other_id);

  /* ── group messages with date dividers ── */
  const grouped = [];
  let lastDate = null;
  messages.forEach(msg => {
    const d = fmtDate(msg.created_at);
    if (d !== lastDate) { grouped.push({ type: 'date', label: d }); lastDate = d; }
    grouped.push({ type: 'msg', msg });
  });

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .chat-sidebar { display: ${mobileView === 'list' ? 'flex' : 'none'} !important; }
          .chat-main    { display: ${mobileView === 'chat' ? 'flex' : 'none'} !important; }
        }
      `}</style>

      <div className="flex h-[calc(100dvh-8rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

        {/* ════ LEFT SIDEBAR ════ */}
        <aside className="chat-sidebar flex w-full shrink-0 flex-col border-r border-gray-100 bg-white sm:flex sm:w-[340px]">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-emerald-600" size={18} />
              <span className="font-extrabold text-gray-900 text-sm">বার্তা</span>
              {globalUnread > 0 && (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                  {globalUnread}
                </span>
              )}
            </div>
            <button type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-emerald-600 transition">
              <Pencil size={14} />
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-gray-100 px-3 py-2.5">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="নাম দিয়ে খুঁজুন..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition" />
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-gray-100 px-3 py-2">
            {FILTER_TABS.map(tab => (
              <button key={tab.id} onClick={() => setFilterTab(tab.id)}
                className={cn(
                  'flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition',
                  filterTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
                )}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              Array.from({ length: 5 }).map((_, i) => <ConvSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <EmptyConvList />
            ) : (
              filtered.map(c => (
                <ConversationItem key={c.conversation_id} conv={c}
                  active={active?.conversation_id === c.conversation_id}
                  onClick={() => selectConversation(c)} />
              ))
            )}
          </div>
        </aside>

        {/* ════ MAIN CHAT WINDOW ════ */}
        <main className="chat-main flex min-w-0 flex-1 flex-col">
          {!active ? (
            <WelcomePane />
          ) : (
            <>
              {/* ── Chat header ── */}
              <header className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 shadow-sm">
                <button type="button" className="sm:hidden rounded-xl p-1.5 hover:bg-gray-100 transition"
                  onClick={() => setMobileView('list')}>
                  <ArrowLeft size={18} className="text-emerald-700" />
                </button>
                <ChatAvatar name={active.other_name} photo={active.other_photo ?? active.other_user_avatar}
                  size={40} online={activeOnline} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-extrabold text-gray-900 text-sm">{active.other_name}</p>
                    <RoleBadge role={active.other_role ?? active.other_user_type} />
                  </div>
                  <p className={cn('text-xs font-medium', typing ? 'text-emerald-600' : activeOnline ? 'text-emerald-500' : 'text-gray-400')}>
                    {typing ? '⌨️ টাইপ করছেন...' : activeOnline ? '● অনলাইন' : '○ অফলাইন'}
                  </p>
                </div>
                {/* Header actions */}
                <div className="flex items-center gap-1">
                  <button type="button"
                    onClick={() => navigate(`/app/experts/${active.other_id}`)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-emerald-600 transition"
                    title="প্রোফাইল দেখুন">
                    <User size={14} />
                  </button>
                  <button type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-emerald-600 transition"
                    title="আরো অপশন">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </header>

              {/* ── Message area ── */}
              <div className="flex-1 overflow-y-auto bg-gray-50 py-3">
                {loadingMsgs ? (
                  <div className="flex flex-col gap-3 px-4 py-6">
                    {[1,2,3].map(i => (
                      <div key={i} className={cn('animate-pulse flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                        <div className={cn('h-10 rounded-2xl bg-gray-200', i % 2 === 0 ? 'w-40' : 'w-48')} />
                      </div>
                    ))}
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                      <MessageSquare size={28} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-600">কথোপকথন শুরু করুন</p>
                      <p className="mt-1 text-xs text-gray-400">প্রথম বার্তাটি পাঠান</p>
                    </div>
                  </div>
                ) : (
                  grouped.map((item, i) =>
                    item.type === 'date' ? (
                      <DateDivider key={`d-${i}`} date={item.label} />
                    ) : (
                      <MessageBubble
                        key={item.msg.message_id ?? item.msg.id}
                        msg={item.msg}
                        mine={sameId(item.msg.sender_id, myId)}
                      />
                    )
                  )
                )}
                {typing && <TypingBubble />}
                <div ref={bottomRef} />
              </div>

              {/* ── Composer ── */}
              <footer className="flex items-end gap-2 border-t border-gray-100 bg-white px-3 py-3">
                <button type="button"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-emerald-600 transition">
                  <Paperclip size={15} />
                </button>
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="বার্তা লিখুন... (Enter = পাঠান)"
                    rows={1}
                    className="max-h-32 min-h-[40px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition"
                  />
                </div>
                {!text.trim() ? (
                  <button type="button"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-emerald-600 transition">
                    <Mic size={15} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSend} disabled={sending}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition active:scale-95">
                    <Send size={15} style={{ transform: 'translateX(1px)' }} />
                  </button>
                )}
              </footer>
            </>
          )}
        </main>
      </div>
    </>
  );
}
