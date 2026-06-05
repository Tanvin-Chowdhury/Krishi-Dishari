import { useRef, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { Avatar, DateDivider, MessageBubble } from './ChatUi';

export default function ChatWindow({
  conversation,
  messages,
  myId,
  loading,
  typing,
  online,
  text,
  sending,
  onTextChange,
  onSend,
  onBack,
  showBack,
  hasMore,
  loadingMore,
  onLoadMore,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const grouped = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const d = new Date(msg.created_at).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (d !== lastDate) {
      grouped.push({ type: 'date', label: d });
      lastDate = d;
    }
    grouped.push({ type: 'msg', msg });
  });

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
        <MessageSquare size={48} strokeWidth={1.2} />
        <p className="m-0 text-sm">একটি কথোপকথন নির্বাচন করুন</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer border-none bg-transparent p-1 md:hidden"
          >
            <ArrowLeft size={20} className="text-emerald-700" />
          </button>
        )}
        <Avatar
          name={conversation.other_name}
          photo={conversation.other_photo}
          size={40}
          online={online}
        />
        <div className="flex-1">
          <div className="text-[15px] font-bold text-slate-900">
            {conversation.other_name}
          </div>
          <div className="text-xs" style={{ color: online ? '#22c55e' : '#94a3b8' }}>
            {typing ? 'টাইপ করছেন...' : online ? 'অনলাইন' : 'অফলাইন'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#F7F8F5] py-3">
        {hasMore && (
          <div className="mb-2 text-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-1 text-xs text-slate-500"
            >
              {loadingMore ? 'লোড হচ্ছে...' : 'পুরনো বার্তা'}
            </button>
          </div>
        )}

        {loading ? (
          <p className="p-6 text-center text-sm text-slate-400">লোড হচ্ছে...</p>
        ) : grouped.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">প্রথম বার্তাটি পাঠান!</p>
        ) : (
          grouped.map((item, i) =>
            item.type === 'date' ? (
              <DateDivider key={`d-${i}`} date={item.label} />
            ) : (
              <div key={item.msg.message_id} className="animate-[fadeIn_.2s_ease]">
                <MessageBubble msg={item.msg} mine={item.msg.sender_id === myId} />
              </div>
            )
          )
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2.5 border-t border-slate-200 bg-white px-4 py-3">
        <textarea
          value={text}
          onChange={onTextChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="বার্তা লিখুন..."
          rows={1}
          className="max-h-[120px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!text.trim() || sending}
          className="flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none text-white transition-transform disabled:cursor-not-allowed"
          style={{
            background:
              text.trim() && !sending
                ? 'linear-gradient(135deg,#0F7B6C,#1A9E78)'
                : '#e2e8e4',
            transform: text.trim() ? 'scale(1)' : 'scale(.95)',
          }}
        >
          <Send size={18} style={{ transform: 'translateX(1px)' }} />
        </button>
      </div>
    </>
  );
}
