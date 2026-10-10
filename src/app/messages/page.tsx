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

function Ticks({ status }: { status: 'sent' | 'delivered' | 'read' }) {
  const color = status === 'read' ? '#4fc3f7' : '#8b9a8f';
  if (status === 'sent') {
    return (
      <svg width="13" height="10" viewBox="0 0 16 11" fill="none" className="inline-flex flex-shrink-0">
        <path d="M1 5.5L5 9.5L15 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="17" height="10" viewBox="0 0 20 11" fill="none" className="inline-flex flex-shrink-0">
      <path d="M1 5.5L5 9.5L15 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 5.5L10 9.5L20 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {  return (
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
  lastMessageStatus?: 'sent' | 'delivered' | 'read' | null;
  unread: boolean;
  unreadCount?: number;
  updatedAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMoved = useRef(false);
  const suppressClick = useRef(false);

  function loadConversations() {
    setLoading(true);
    setLoadError(false);
    fetchConversations().then((result) => {
      if (result.success) {
        setConversations(result.data);
      } else {
        setLoadError(true);
      }
      setLoading(false);
    }).catch(() => {
      setLoadError(true);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadConversations();

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

  function toggleConversationSelection(id: string) {
    setSelectedConversationIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
    setOpenActions(null);
  }

  function startPress(id: string) {
    clearPressTimer();
    touchMoved.current = false;
    pressTimer.current = setTimeout(() => {
      if (!touchMoved.current) {
        suppressClick.current = true;
        toggleConversationSelection(id);
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
    if (selectedConversationIds.length > 0) {
      event.preventDefault();
      toggleConversationSelection(id);
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

  async function handleDeleteSelected() {
    if (deleting || selectedConversationIds.length === 0) return;
    const ids = [...selectedConversationIds];
    setDeleting('selected');

    const deletedIds: string[] = [];
    for (const id of ids) {
      const result = await deleteConversation(id);
      if (result.success) deletedIds.push(id);
    }

    if (deletedIds.length) {
      setConversations((prev) => prev.filter((c) => !deletedIds.includes(c.id)));
      setPreviews((prev) => {
        const next = { ...prev };
        for (const id of deletedIds) delete next[id];
        return next;
      });
    }

    setSelectedConversationIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
    setOpenActions(null);
    setDeleting(null);
  }

  function clearSelection() {
    setSelectedConversationIds([]);
    setOpenActions(null);
  }

  return (
    <div className="mx-auto w-full max-w-xl" onClick={() => openActions && setOpenActions(null)}>
      <div className="flex items-center justify-between px-4 py-3">
        {selectedConversationIds.length > 0 ? (
          <>
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm font-medium text-slate-600"
            >
              Cancel
            </button>
            <h1 className="text-lg font-semibold">{selectedConversationIds.length} selected</h1>
            <button
              type="button"
              aria-label="Delete selected conversations"
              disabled={deleting === 'selected'}
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteSelected();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-red-600 disabled:opacity-50"
            >
              <TrashIcon />
            </button>
          </>
        ) : (
          <h1 className="text-lg font-semibold">Messages</h1>
        )}
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

      {!loading && loadError && (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <p className="text-sm font-semibold text-slate-800">Couldn't load conversations</p>
          <p className="mt-1 text-xs text-slate-500">Check your connection and try again.</p>
          <button onClick={loadConversations} className="mt-3 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white">Retry</button>
        </div>
      )}

      {!loading && !loadError && filteredConversations.length === 0 && (
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
              event.stopPropagation();
              toggleConversationSelection(c.id);
            }}
          >
            <Link
              href={`/messages/${c.id}`}
              onClick={(event) => handleRowClick(event, c.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              className={`relative z-10 flex items-center gap-3 px-4 py-3 transition-transform duration-200 hover:bg-slate-50 ${selectedConversationIds.includes(c.id) ? 'bg-blue-50' : 'bg-white'} ${openActions === c.id ? '-translate-x-20' : 'translate-x-0'}`}
            >
              {selectedConversationIds.includes(c.id) && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  ✓
                </span>
              )}
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
                <p className={`flex items-center gap-1 truncate text-sm ${c.unread ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                  {c.lastMessage && !c.lastMessage.isDeleted && c.lastMessage.senderId === user?.id && c.lastMessageStatus && (
                    <Ticks status={c.lastMessageStatus} />
                  )}
                  <span className="truncate">
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
                  </span>
                </p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <span className={`text-xs ${c.unread ? 'font-semibold text-blue-600' : 'text-slate-400'}`}>{formatConversationTime(c.updatedAt)}</span>
                {c.unread && (c.unreadCount || 0) > 1 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[11px] font-bold text-white">
                    {(c.unreadCount || 0) > 99 ? '99+' : c.unreadCount}
                  </span>
                )}
                {c.unread && (c.unreadCount || 0) <= 1 && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
              </div>
            </Link>
            <button
              type="button"
              aria-label="Delete conversation"
              disabled={deleting === c.id}
              onClick={() => setConfirmDeleteId(c.id)}
              className="absolute right-0 top-0 z-0 flex h-full w-20 items-center justify-center bg-red-600 text-white"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setConfirmDeleteId(null)}>
          <div className="w-full max-w-xl rounded-t-2xl bg-white p-5 pb-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-center text-base font-semibold text-slate-900">Delete conversation?</p>
            <p className="mt-1 text-center text-sm text-slate-500">This will remove the chat from your list. This can't be undone.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-full bg-slate-100 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button
                onClick={() => { const id = confirmDeleteId; setConfirmDeleteId(null); handleDelete(id); }}
                disabled={deleting === confirmDeleteId}
                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
