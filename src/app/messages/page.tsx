'use client';

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { fetchConversations, deleteConversation } from '@/lib/api/messageApi';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth/useAuth';
import VerifiedBadge from '@/components/VerifiedBadge';
import Avatar from '@/components/Avatar';

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
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The one press currently in flight, if any. It is recorded on
  // pointerdown and dropped on pointerup, pointercancel or a move of
  // more than 10px, so the long-press timer can only ever fire for a
  // finger that is still down on the row the press started on.
  const pressRef = useRef<{ pointerId: number; rowId: string; startX: number; startY: number } | null>(null);
  // Set by the long-press timer when it fires, and by nothing else.
  // The row click handler consumes it, so the click produced when the
  // finger lifts after a long-press does not also open the chat. It is
  // cleared at the start of every pointerdown, so it can never leak
  // into a later gesture and swallow an unrelated tap.
  const longPressFired = useRef(false);

  function showToast(message: string, type: 'success' | 'error') {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ message, type });
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  }

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
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    // A burst of socket events (a message landing together with the
    // presence events around it) must not fire one list fetch per
    // event: everything inside a short window collapses into one fetch.
    function refresh() {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        fetchConversations().then((result) => {
          if (result.success) {
            setConversations(result.data);
            // A background refresh must not silently clear an active
            // selection: keep the selected ids that still exist and
            // drop only the ones whose conversation is gone.
            setSelectedConversationIds((prev) =>
              prev.filter((id) => result.data.some((c: ConversationItem) => c.id === id))
            );
          }
        });
      }, 300);
    }
    socket.on('message:new', refresh);
    socket.on('presence:online', refresh);
    socket.on('presence:offline', refresh);
    // Messages that arrived while the socket was down produce no live
    // event here, so a reconnect refetches the list on its own.
    socket.on('connect', refresh);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      socket.off('message:new', refresh);
      socket.off('presence:online', refresh);
      socket.off('presence:offline', refresh);
      socket.off('connect', refresh);
    };
  }, []);

  useEffect(() => {
    const updates: Record<string, string> = {};
    for (const c of conversations) {
      // Keep the cached preview in step with the conversation's current
      // last message. The old write-once rule froze the first text a
      // conversation ever showed, so a new message never updated the
      // row's preview until the page was reloaded.
      if (c.lastMessage?.content && previews[c.id] !== c.lastMessage.content) {
        updates[c.id] = c.lastMessage.content;
      }
    }
    if (Object.keys(updates).length) {
      setPreviews((prev) => ({ ...prev, ...updates }));
    }
  }, [conversations, previews]);

  // No timer may outlive the page.
  useEffect(() => {
    return () => {
      clearPressTimer();
    };
  }, []);

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
  }

  function startPress(id: string) {
    clearPressTimer();
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      // The press record is dropped the moment the gesture ends or
      // turns into a scroll, so reaching this line with the record
      // still pointing at this row means the finger is still down on
      // it: a genuine long-press. Toggle the row's selection and mark
      // this gesture so its click is consumed when the finger lifts.
      const press = pressRef.current;
      if (press && press.rowId === id) {
        longPressFired.current = true;
        toggleConversationSelection(id);
      }
    }, 550);
  }

  function handlePointerDown(id: string, event: ReactPointerEvent<HTMLDivElement>) {
    // One press at a time: a second finger (or a non-primary mouse
    // button) never starts or disturbs a press.
    if (!event.isPrimary || event.button !== 0) return;
    if (pressRef.current) return;
    // Every new press starts clean: a long-press mark left behind by
    // an earlier gesture whose click never arrived must not eat this
    // gesture's tap.
    longPressFired.current = false;
    pressRef.current = {
      pointerId: event.pointerId,
      rowId: id,
      startX: event.clientX,
      startY: event.clientY,
    };
    startPress(id);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const press = pressRef.current;
    if (!press || event.pointerId !== press.pointerId) return;
    // Moving more than a few pixels means the gesture is a scroll,
    // not a press: the long-press is cancelled for good.
    if (Math.abs(event.clientX - press.startX) > 10 || Math.abs(event.clientY - press.startY) > 10) {
      clearPressTimer();
      pressRef.current = null;
    }
  }

  // Shared cleanup for pointerup and pointercancel: the gesture is
  // over, so the timer is cleared and can never fire after the fact.
  // A long-press mark set by the timer stays in place until the click
  // that follows consumes it (or the next press starts and clears it).
  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const press = pressRef.current;
    if (!press || event.pointerId !== press.pointerId) return;
    clearPressTimer();
    pressRef.current = null;
  }

  function handleRowClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    // The click that follows a long-press only ends that gesture; the
    // selection toggle already happened when the timer fired, so this
    // click must not also open the chat.
    if (longPressFired.current) {
      longPressFired.current = false;
      event.preventDefault();
      return;
    }
    if (selectedConversationIds.length > 0) {
      event.preventDefault();
      toggleConversationSelection(id);
      return;
    }
    // Otherwise the tap is a plain tap: let the Link open the chat.
  }

  async function handleDeleteSelected() {
    if (deleting || selectedConversationIds.length === 0) return;
    const ids = [...selectedConversationIds];
    setConfirmBulkDelete(false);
    setDeleting('selected');
    setBulkProgress({ done: 0, total: ids.length });

    try {
      // Delete in parallel; a single failed request must not strand the
      // rest or leave the button disabled forever (the old serial loop
      // escaped on the first throw and never reset `deleting`). Each
      // settle advances the visible "Deleting n of N…" counter.
      let done = 0;
      const results = await Promise.all(
        ids.map(async (id) => {
          let ok = false;
          try {
            const result = await deleteConversation(id);
            ok = result.success;
          } catch {
            ok = false;
          }
          done += 1;
          setBulkProgress({ done, total: ids.length });
          return ok ? id : null;
        })
      );
      const deletedIds = results.filter((x): x is string => x !== null);
      const failedCount = ids.length - deletedIds.length;

      if (deletedIds.length) {
        setConversations((prev) => prev.filter((c) => !deletedIds.includes(c.id)));
        setPreviews((prev) => {
          const next = { ...prev };
          for (const id of deletedIds) delete next[id];
          return next;
        });
      }

      setSelectedConversationIds((prev) => prev.filter((id) => !deletedIds.includes(id)));

      // Report the outcome — partial failures used to be completely silent.
      if (failedCount === 0) {
        showToast(`${deletedIds.length} conversation${deletedIds.length === 1 ? '' : 's'} deleted`, 'success');
      } else {
        showToast(`${deletedIds.length} deleted · ${failedCount} could not be deleted`, 'error');
      }
    } finally {
      setDeleting(null);
      setBulkProgress(null);
    }
  }

  function clearSelection() {
    setSelectedConversationIds([]);
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {toast && (
        <div
          className={`fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-slate-900' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
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
            {deleting === 'selected' ? (
              <span className="flex h-9 items-center text-sm font-medium text-red-600" role="status">
                {bulkProgress ? `Deleting ${bulkProgress.done} of ${bulkProgress.total}…` : 'Deleting…'}
              </span>
            ) : (
              <button
                type="button"
                aria-label="Delete selected conversations"
                onClick={(event) => {
                  event.stopPropagation();
                  setConfirmBulkDelete(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-red-600 disabled:opacity-50"
              >
                <TrashIcon />
              </button>
            )}
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
            onPointerDown={(event) => handlePointerDown(c.id, event)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
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
              className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 ${selectedConversationIds.includes(c.id) ? 'bg-blue-50' : 'bg-white'}`}
            >
              {selectedConversationIds.includes(c.id) && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  ✓
                </span>
              )}
              <div className="relative flex-shrink-0">
                <Avatar url={c.otherUser?.profilePictureUrl} name={c.otherUser?.displayName || c.otherUser?.username} px={48} />
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
          </div>
        ))}
      </div>

      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setConfirmBulkDelete(false)}>
          <div className="w-full max-w-xl rounded-t-2xl bg-white p-5 pb-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-center text-base font-semibold text-slate-900">Delete {selectedConversationIds.length} conversation{selectedConversationIds.length === 1 ? '' : 's'}?</p>
            <p className="mt-1 text-center text-sm text-slate-500">This will remove the chats from your list. This can't be undone.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmBulkDelete(false)} className="flex-1 rounded-full bg-slate-100 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting === 'selected'}
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
