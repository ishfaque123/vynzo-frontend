'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchMessages, fetchConversations } from '@/lib/api/messageApi';
import { blockUser, reportUser } from '@/lib/api/userApi';
import { getSocket } from '@/lib/socket';

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  );
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; username: string; displayName: string; profilePictureUrl?: string };
}
interface OtherUser {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  isOnline: boolean;
  lastActiveAt?: string | null;
}

function formatLastSeen(dateStr?: string | null) {
  if (!dateStr) return 'Offline';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Last seen just now';
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Last seen ${days}d ago`;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchMessages(conversationId).then((result) => {
      if (result.success) setMessages(result.data);
      setLoading(false);
    });

    fetchConversations().then((result) => {
      if (result.success) {
        const convo = result.data.find((c: any) => c.id === conversationId);
        if (convo?.otherUser) setOtherUser(convo.otherUser);
      }
    });

    const socket = getSocket();

    function handleNewMessage(message: Message) {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      if (message.senderId !== user?.id) {
        socket.emit('conversation:read', { conversationId });
      }
    }
    function handleTypingStart({ conversationId: cid, userId }: { conversationId: string; userId: string }) {
      if (cid === conversationId && userId !== user?.id) setOtherTyping(true);
    }
    function handleTypingStop({ conversationId: cid, userId }: { conversationId: string; userId: string }) {
      if (cid === conversationId && userId !== user?.id) setOtherTyping(false);
    }
    function handlePresenceOnline({ userId }: { userId: string }) {
      setOtherUser((prev) => (prev && prev.id === userId ? { ...prev, isOnline: true } : prev));
    }
    function handlePresenceOffline({ userId, lastActiveAt }: { userId: string; lastActiveAt: string }) {
      setOtherUser((prev) => (prev && prev.id === userId ? { ...prev, isOnline: false, lastActiveAt } : prev));
    }

    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('presence:online', handlePresenceOnline);
    socket.on('presence:offline', handlePresenceOffline);
    socket.emit('conversation:read', { conversationId });

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('presence:online', handlePresenceOnline);
      socket.off('presence:offline', handlePresenceOffline);
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleTyping(value: string) {
    setText(value);
    const socket = getSocket();
    socket.emit('typing:start', { conversationId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId });
    }, 1500);
  }

  function sendMessage() {
    const content = text.trim();
    if (!content) return;
    const socket = getSocket();
    socket.emit('message:send', { conversationId, content }, (res: { success: boolean; data?: Message; error?: string }) => {
      if (res.success && res.data) {
        setMessages((prev) => (prev.some((m) => m.id === res.data!.id) ? prev : [...prev, res.data!]));
      } else if (res.error === 'BLOCKED') {
        alert("You can't send messages to this user.");
      }
    });
    setText('');
    socket.emit('typing:stop', { conversationId });
  }

  async function handleReport() {
    if (!otherUser) return;
    setMoreOpen(false);
    const reason = prompt('Reason (spam, harassment, hate_speech, violence, nudity, misinformation, other):', 'other');
    const result = await reportUser(otherUser.id, reason);
    if (result.success) alert('Reported. Thank you.');
    else alert(result.error?.message || 'Could not report this user.');
  }

  async function handleBlock() {
    if (!otherUser) return;
    setMoreOpen(false);
    if (!confirm(`Block ${otherUser.displayName || otherUser.username}?`)) return;
    const result = await blockUser(otherUser.id);
    if (result.success) {
      router.push('/messages');
    } else {
      alert('Could not block this user.');
    }
  }

  const displayName = otherUser?.displayName || otherUser?.username || 'Chat';
  const statusText = otherTyping ? 'Typing...' : otherUser?.isOnline ? 'Online' : formatLastSeen(otherUser?.lastActiveAt);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-xl flex-col">
      <div className="flex items-center justify-between gap-2 border-b bg-white px-3 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/messages')} aria-label="Back">
            <BackIcon />
          </button>
          <div>
            <p className="font-semibold leading-tight">{displayName}</p>
            <p className={`text-xs leading-tight ${otherUser?.isOnline ? 'text-green-600' : 'text-slate-400'}`}>{statusText}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMoreOpen(!moreOpen)} aria-label="More options" className="p-1 text-slate-600">
            <MoreIcon />
          </button>
          {moreOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border bg-white py-1 shadow-lg" onMouseLeave={() => setMoreOpen(false)}>
              <button onClick={handleBlock} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50">Block user</button><button onClick={handleReport} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Report</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {loading && <p className="text-center text-slate-500">Loading...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-slate-500">Say hi 👋</p>
        )}
        <div className="space-y-2">
          {messages.map((m) => {
            const isMine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isMine ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t bg-white p-3">
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Message..."
          className="flex-1 rounded-full border px-4 py-2 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="rounded-full bg-slate-900 p-2.5 text-white disabled:opacity-40"
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
