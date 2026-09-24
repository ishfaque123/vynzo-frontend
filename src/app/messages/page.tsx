'use client';

import { useEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import Link from 'next/link';
import { fetchConversations, deleteConversation } from '@/lib/api/messageApi';
import { getSocket } from '@/lib/socket';
import { getOrCreateIdentity, deriveSharedKey, tryDecryptText } from '@/lib/crypto/e2ee';
import { useAuth } from '@/lib/auth/useAuth';

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
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
  otherUser: { id: string; username: string; displayName: string; profilePictureUrl?: string; isOnline: boolean; publicKey?: string | null } | null;
  lastMessage: { content: string; senderId: string; createdAt: string; mediaType?: 'image' | 'voice' | null; isDeleted?: boolean } | null;
  unread: boolean;
  updatedAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
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
    if (!user?.id) return;
    const pending = conversations.filter(
      (c) => c.lastMessage?.content && c.otherUser?.publicKey && !(c.id in previews)
    );
    if (!pending.length) return;
    let cancelled = false;
    (async () => {
      const { privateKey } = await getOrCreateIdentity(user.id, user.publicKey);
      const updates: Record<string, string> = {};
      for (const c of pending) {
        const key = await deriveSharedKey(privateKey, c.otherUser!.publicKey!);
        updates[c.id] = await tryDecryptText(key, c.lastMessage!.content);
      }
      if (!cancelled) setPreviews((prev) => ({ ...prev, ...updates }));
    })();
    return () => {
      cancelled = true;
    };
  }, [conversations, user?.id]);

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
    <div className="mx-auto max-w-xl" onClick={() => openActions && setOpenActions(null)}>
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold">Messages</h1>
        <Link href="/messages/new" aria-label="New message" className="rounded-full bg-slate-900 p-2 text-white">
          <PlusIcon />
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-6" role="status" aria-label="Loading messages">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <p className="px-4 text-slate-500">No conversations yet. Start one!</p>
      )}

      <div className="divide-y">
        {conversations.map((c) => (
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
                <p className={`truncate ${c.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                  {c.otherUser?.displayName || c.otherUser?.username}
                </p>
                <p className={`truncate text-sm ${c.unread ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                  {c.lastMessage
                    ? c.lastMessage.isDeleted
                      ? 'This message was deleted'
                      : c.lastMessage.mediaType === 'image'
                      ? '📷 Photo'
                      : c.lastMessage.mediaType === 'voice'
                      ? '🎤 Voice message'
                      : c.lastMessage.content
                      ? (previews[c.id] || '···')
                      : 'Say hi 👋'
                    : 'Say hi 👋'}
                </p>
              </div>
              {c.unread && <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />}
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
