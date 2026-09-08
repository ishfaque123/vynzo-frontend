'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchMessages } from '@/lib/api/messageApi';
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

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; username: string; displayName: string; profilePictureUrl?: string };
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchMessages(conversationId).then((result) => {
      if (result.success) setMessages(result.data);
      setLoading(false);
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

    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.emit('conversation:read', { conversationId });

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
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
    socket.emit('message:send', { conversationId, content }, (res: { success: boolean; data?: Message }) => {
      if (res.success && res.data) {
        setMessages((prev) => (prev.some((m) => m.id === res.data!.id) ? prev : [...prev, res.data!]));
      }
    });
    setText('');
    socket.emit('typing:stop', { conversationId });
  }

  const otherUser = messages.find((m) => m.senderId !== user?.id)?.sender;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-xl flex-col">
      <div className="flex items-center gap-2 border-b bg-white px-3 py-3">
        <button onClick={() => router.push('/messages')} aria-label="Back">
          <BackIcon />
        </button>
        <p className="font-semibold">
          {otherTyping ? 'Typing...' : otherUser?.displayName || otherUser?.username || 'Chat'}
        </p>
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
