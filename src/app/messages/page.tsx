'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchConversations } from '@/lib/api/messageApi';
import { getSocket } from '@/lib/socket';

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

interface ConversationItem {
  id: string;
  otherUser: { id: string; username: string; displayName: string; profilePictureUrl?: string; isOnline: boolean } | null;
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
  unread: boolean;
  updatedAt: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations().then((result) => {
      if (result.success) setConversations(result.data);
      setLoading(false);
    });

    const socket = getSocket();
    function refresh() {
      fetchConversations().then((result) => {
        if (result.success) setConversations(result.data);
      });
    }
    socket.on('message:new', refresh);
    socket.on('presence:online', refresh);
    socket.on('presence:offline', refresh);

    return () => {
      socket.off('message:new', refresh);
      socket.off('presence:online', refresh);
      socket.off('presence:offline', refresh);
    };
  }, []);

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold">Messages</h1>
        <Link href="/messages/new" aria-label="New message" className="rounded-full bg-slate-900 p-2 text-white">
          <PlusIcon />
        </Link>
      </div>

      {loading && <p className="px-4 text-slate-500">Loading...</p>}

      {!loading && conversations.length === 0 && (
        <p className="px-4 text-slate-500">No conversations yet. Start one!</p>
      )}

      <div className="divide-y">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
          >
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                {c.otherUser?.profilePictureUrl ? (
                  <img src={c.otherUser.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  c.otherUser?.displayName?.[0]?.toUpperCase() || '?'
                )}
              </div>
              {c.otherUser?.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate ${c.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                {c.otherUser?.displayName || c.otherUser?.username}
              </p>
              <p className={`truncate text-sm ${c.unread ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                {c.lastMessage?.content || 'Say hi 👋'}
              </p>
            </div>
            {c.unread && <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
