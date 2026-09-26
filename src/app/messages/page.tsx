'use client';

import { useEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import Link from 'next/link';
import { fetchConversations, deleteConversation } from '@/lib/api/messageApi';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth/useAuth';
import VerifiedBadge from '@/components/VerifiedBadge';

function formatConversationTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
    </svg>
  );
}

interface ConversationItem {
  id: string;
  otherUser: { id: string; username: string; displayName: string; profilePictureUrl?: string; isOnline: boolean; isVerified?: boolean } | null;
  lastMessage: { content: string; senderId: string; createdAt: string; mediaType?: 'image' | 'voice' | null; isDeleted?: boolean } | null;
  unread: boolean;
  updatedAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMoved = useRef(false);
  const suppressClick = useRef(false);

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

  useEffect(() => {
    const updates: Record<string, string> = {};
    for (const c of conversations) {
      if (c.lastMessage?.content && !(c.id in previews)) {
        updates[c.id] = c.lastMessage.content;
      }
    }
    if (Object.keys(updates).length) {
      setPreviews((prev) => ({ ...prev, ...updates }));
    }
  }, [conversations, previews]);

  const filteredConversations = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const name = c.otherUser?.displayName?.toLowerCase() || '';
    const username = c.otherUser?.username?.toLowerCase() || '';
    return name.includes(q) || username.includes(q);
  });

  function clearPressTimer() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function startPress(id: string) {
    clearPressTimer();
    touchMoved.current = false;
    pressTimer.current = setTimeout(() => {
      if (!touchMoved.current) {
        suppressClick.current = true;
        setOpenActions(id);
      }
    }, 550);
  }

  function handleTouchStart(id: string, event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
    touchMoved.current = false;
    startPress(id);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    if (startX == null || startY == null) return;
    const dx = event.touches[0].clientX - startX;
    const dy = event.touches[0].clientY - startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) touchMoved.current = true;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) clearPressTimer();
  }

  function handleTouchEnd(id: string, event: TouchEvent<HTMLDivElement>) {
    clearPressTimer();
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    if (startX == null || startY == null) return;
    const dx = event.changedTouches[0].clientX - startX;
    const dy = event.changedTouches[0].clientY - startY;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      suppressClick.current = true;
      if (dx < 0) setOpenActions(id);
      else setOpenActions(null);
    }
  }

  function handleRowClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (suppressClick.current) {
      event.preventDefault();
      suppressClick.current = false;
      return;
    }
    if (openActions === id) {
      event.preventDefault();
      setOpenActions(null);
    }
  }

  async function handleDelete(id: string) {
    if (deleting) return;
    setDeleting(id);
    const result = await deleteConversation(id);
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setPreviews((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setOpenActions(null);
    }
    setDeleting(null);
  }

  return (
    <div className="mx-auto w-full max-w-xl" onClick={() => openActions && setOpenActions(null)}>
      <div className="px-4 py-3">
        <h1 className="text-lg font-semibold">Messages</h1>
      </div>

      <div className="px-4 pb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          aria-label="Search conversations"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
        />
      </div>

      {loading && (
        <div className="flex flex-col gap-3 px-4" role="status" aria-label="Loading messages">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-3 py-3">
              <div className="skeleton-shimmer h-12 w-12 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="skeleton-shimmer h-3 w-32 rounded" />
                <div className="skeleton-shimmer h-3 w-48 max-w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredConversations.length === 0 && (
        <p className="px-4 text-slate-500">
          {search.trim() ? 'No conversations found.' : 'No conversations yet. Start one!'}
        </p>
      )}

      <div className="divide-y">
        {filteredConversations.map((c) => (
          <div
            key={c.id}
            className="relative overflow-hidden"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => handleTouchStart(c.id, event)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(event) => handleTouchEnd(c.id, event)}
            onContextMenu={(event) => {
              event.preventDefault();
              setOpenActions(c.id);
            }}
          >
            <Link
              href={`/messages/${c.id}`}
              onClick={(event) => handleRowClick(event, c.id)}
              className={`relative z-10 flex items-center gap-3 bg-white px-4 py-3 transition-transform duration-200 hover:bg-slate-50 ${openActions === c.id ? '-translate-x-20' : 'translate-x-0'}`}
            >
              <div className="relative flex-shrink-0">
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
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className={`flex items-center gap-1 truncate ${c.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                  <span className="truncate">{c.otherUser?.displayName || c.otherUser?.username}</span>
                  {c.otherUser?.isVerified && <VerifiedBadge size="sm" />}
                </p>
                <p className={`truncate text-sm ${c.unread ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                  {c.lastMessage && !c.lastMessage.isDeleted && c.lastMessage.senderId === user?.id ? 'You: ' : ''}
                  {c.lastMessage
                    ? c.lastMessage.isDeleted
                      ? 'This message was deleted'
                      : c.lastMessage.mediaType === 'image'
                      ? 'Photo'
                      : c.lastMessage.mediaType === 'voice'
                      ? 'Voice message'
                      : c.lastMessage.content
                      ? (previews[c.id] || '···')
                      : 'Say hi'
                    : 'Say hi 👋'}
                </p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <span className={`text-xs ${c.unread ? 'font-semibold text-blue-600' : 'text-slate-400'}`}>{formatConversationTime(c.updatedAt)}</span>
                {c.unread && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
              </div>
            </Link>
            <button
              type="button"
              aria-label="Delete conversation"
              disabled={deleting === c.id}
              onClick={() => handleDelete(c.id)}
              className="absolute right-0 top-0 z-0 flex h-full w-20 items-center justify-center bg-red-600 text-white"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
