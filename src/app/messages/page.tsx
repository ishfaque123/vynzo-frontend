'use client';

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

// Width of the delete panel a swipe reveals, in pixels. The row content
// slides between 0 (closed) and -PANEL_WIDTH (fully open).
const PANEL_WIDTH = 80;

// One in-flight row gesture, owned by a single pointer. A gesture is
// created on pointerdown and destroyed on pointerup/pointercancel, so
// no part of it — including click suppression — can leak into the next
// gesture the way the old touch latch did.
interface RowGesture {
  pointerId: number;
  rowId: string;
  startX: number;
  startY: number;
  // Row position when the gesture began: 0 (closed) or -PANEL_WIDTH (open).
  baseOffset: number;
  // True once the drag is confirmed horizontal (|dx| > 10 and clearly
  // dominant over |dy|); from then on the row follows the finger.
  horizontal: boolean;
  // True once the finger has moved more than a few pixels in any
  // direction; a moved gesture is never a long-press.
  moved: boolean;
  // True when this gesture began on another row while a delete panel
  // was open: the tap only dismisses that panel and must not navigate.
  dismissOnly: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureRef = useRef<RowGesture | null>(null);
  const suppressClick = useRef(false);
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The sliding row-content element of each row, keyed by conversation
  // id, so a drag can move the row under the finger with a direct style
  // write instead of re-rendering the list on every pointermove.
  const rowContentRefs = useRef(new Map<string, HTMLAnchorElement>());

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

  // An open delete panel closes as soon as the list scrolls, so it can
  // never stay stuck open while the user browses the conversations.
  // This page has no inner scroll container — the Shell renders the
  // list in normal document flow, so the document itself is the
  // scroller. A capture-phase listener on window receives those scroll
  // events, and also the scroll events of any nested scroller, whose
  // scroll events do not bubble but do pass through window in capture.
  useEffect(() => {
    if (!openActions) return;
    function closeOpenPanelOnScroll() {
      setOpenActions(null);
    }
    window.addEventListener('scroll', closeOpenPanelOnScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', closeOpenPanelOnScroll, { capture: true });
    };
  }, [openActions]);

  // Leaving the page or hiding it (app switch, tab switch, WebView
  // pause) drops every piece of transient row state, so nothing — an
  // open panel, a half-finished gesture, an armed latch — can survive
  // into the next visit and leave a row looking stuck.
  useEffect(() => {
    function resetTransientRowState() {
      clearPressTimer();
      clearSuppressClick();
      gestureRef.current = null;
      setOpenActions(null);
    }
    function handleVisibilityChange() {
      if (document.hidden) resetTransientRowState();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Same reset when the route changes away from this list.
  useEffect(() => {
    clearPressTimer();
    clearSuppressClick();
    gestureRef.current = null;
    setOpenActions(null);
  }, [pathname]);

  // No timer may outlive the page.
  useEffect(() => {
    return () => {
      clearPressTimer();
      if (suppressTimer.current) {
        clearTimeout(suppressTimer.current);
        suppressTimer.current = null;
      }
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

  // Click suppression lives and dies with one gesture: it is cleared
  // when a new gesture starts, consumed by the click it belongs to, and
  // otherwise expires on a short safety timer that only starts once
  // the gesture has ended (see scheduleSuppressExpiry). It can never
  // sit armed across gestures and eat an unrelated tap.
  function armSuppressClick() {
    suppressClick.current = true;
    if (suppressTimer.current) {
      clearTimeout(suppressTimer.current);
      suppressTimer.current = null;
    }
  }

  function clearSuppressClick() {
    suppressClick.current = false;
    if (suppressTimer.current) {
      clearTimeout(suppressTimer.current);
      suppressTimer.current = null;
    }
  }

  function scheduleSuppressExpiry() {
    if (!suppressClick.current) return;
    if (suppressTimer.current) clearTimeout(suppressTimer.current);
    suppressTimer.current = setTimeout(() => {
      suppressClick.current = false;
      suppressTimer.current = null;
    }, 350);
  }

  function toggleConversationSelection(id: string) {
    setSelectedConversationIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
    setOpenActions(null);
  }

  function startPress(id: string) {
    clearPressTimer();
    pressTimer.current = setTimeout(() => {
      // Only a finger that is still down, on this row, and has neither
      // moved nor turned into a swipe counts as a long-press. The
      // gesture object is destroyed when the gesture ends, so this
      // callback can never fire after the fact for a gesture the
      // browser already took over or cancelled.
      const gesture = gestureRef.current;
      if (gesture && gesture.rowId === id && !gesture.moved && !gesture.horizontal) {
        armSuppressClick();
        toggleConversationSelection(id);
      }
    }, 550);
  }

  function handlePointerDown(id: string, event: ReactPointerEvent<HTMLDivElement>) {
    // One gesture at a time: a second finger (or a non-primary mouse
    // button) never starts or disturbs a gesture.
    if (!event.isPrimary || event.button !== 0) return;
    if (gestureRef.current) return;
    // Every new gesture starts with a clean latch: suppression armed by
    // an earlier gesture must not eat this gesture's tap.
    clearSuppressClick();
    // A delete panel open on another row closes on the first touch of
    // this row, and that touch does not also open this row's chat —
    // otherwise the old panel would stay open forever. The suppression
    // for that dismiss tap is armed when the gesture ends, in
    // handlePointerEnd, not here.
    let dismissOnly = false;
    if (openActions !== null && openActions !== id) {
      setOpenActions(null);
      dismissOnly = true;
    }
    gestureRef.current = {
      pointerId: event.pointerId,
      rowId: id,
      startX: event.clientX,
      startY: event.clientY,
      baseOffset: openActions === id ? -PANEL_WIDTH : 0,
      horizontal: false,
      moved: false,
      dismissOnly,
    };
    startPress(id);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) gesture.moved = true;

    if (!gesture.horizontal) {
      // Horizontal intent: clearly sideways and clearly dominant over
      // vertical movement. From here the gesture is a swipe, never a
      // scroll or a long-press. touch-action: pan-y on the row keeps
      // vertical scrolling with the browser, so a gesture that reaches
      // this point is not stolen for scrolling.
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        gesture.horizontal = true;
        clearPressTimer();
        // Capture the pointer so this row keeps receiving the move and
        // end events even if the finger drifts off the row.
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // The pointer is already gone; the end handlers will clean up.
        }
        const el = rowContentRefs.current.get(gesture.rowId);
        if (el) el.style.transition = 'none';
      } else {
        return;
      }
    }

    // Drag-follow: the row tracks the finger, clamped between fully
    // open and fully closed.
    const el = rowContentRefs.current.get(gesture.rowId);
    if (el) {
      const offset = Math.max(-PANEL_WIDTH, Math.min(0, gesture.baseOffset + dx));
      el.style.transform = `translateX(${offset}px)`;
    }
  }

  // Shared cleanup for the row element a drag was moving: dropping the
  // inline styles hands the row back to its class-based position, and
  // the class transition animates the snap from the drag position.
  function releaseDraggedRow(rowId: string) {
    const el = rowContentRefs.current.get(rowId);
    if (el) {
      el.style.transition = '';
      el.style.transform = '';
    }
  }

  function releasePointerCapture(event: ReactPointerEvent<HTMLDivElement>) {
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Capture was already released; nothing to do.
    }
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gestureRef.current = null;
    clearPressTimer();
    // Release capture before the click is generated so the click is
    // hit-tested normally; the suppression armed below is what stops a
    // swipe's click from acting, not the capture target.
    releasePointerCapture(event);
    releaseDraggedRow(gesture.rowId);

    if (gesture.horizontal) {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      // The release decision keeps the long-standing swipe rule: a
      // deliberate swipe is more than 70px and clearly horizontal, and
      // it opens (left) or closes (right). A shorter drag changes
      // nothing — openActions still holds the state the gesture began
      // with, so releasing the inline transform snaps the row back to
      // exactly where it started.
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        setOpenActions(dx < 0 ? gesture.rowId : null);
      }
      // A swipe is not a tap: the click that follows it must not act.
      armSuppressClick();
    } else if (gesture.dismissOnly) {
      // The tap only dismissed another row's panel; it must not also
      // open this row's chat.
      armSuppressClick();
    }
    // If the long-press timer fired during this gesture, suppression is
    // already armed; either way the expiry countdown starts now that
    // the gesture is over.
    scheduleSuppressExpiry();
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gestureRef.current = null;
    clearPressTimer();
    // The browser took the gesture over (scroll, pull-to-refresh,
    // system gesture), so no click will follow it. The panel state is
    // left exactly as the gesture found it — clearing the inline
    // transform snaps the row back to that state — and any suppression
    // the gesture armed starts expiring instead of leaking forward.
    releaseDraggedRow(gesture.rowId);
    scheduleSuppressExpiry();
  }

  function handleRowClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (suppressClick.current) {
      event.preventDefault();
      clearSuppressClick();
      return;
    }
    if (selectedConversationIds.length > 0) {
      event.preventDefault();
      toggleConversationSelection(id);
      return;
    }
    // Tapping a row whose delete panel is open used to only close the
    // panel and swallow the tap, so the chat never opened and the user
    // had to tap twice. Now the tap closes the panel AND opens the chat.
    if (openActions === id) {
      setOpenActions(null);
    }
  }

  async function handleDelete(id: string) {
    if (deleting) return;
    setDeleting(id);
    try {
      const result = await deleteConversation(id);
      if (result.success) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        setPreviews((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setOpenActions(null);
      } else {
        showToast('Could not delete conversation.', 'error');
      }
    } catch {
      // A failed request must never leave the delete buttons disabled —
      // and must no longer fail silently either.
      showToast('Could not delete conversation.', 'error');
    } finally {
      setDeleting(null);
    }
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
      setOpenActions(null);

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
    setOpenActions(null);
  }

  return (
    <div className="mx-auto w-full max-w-xl" onClick={() => openActions && setOpenActions(null)}>
      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${
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
            className="relative overflow-hidden touch-pan-y"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => handlePointerDown(c.id, event)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerCancel}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleConversationSelection(c.id);
            }}
          >
            <Link
              href={`/messages/${c.id}`}
              ref={(el) => {
                if (el) rowContentRefs.current.set(c.id, el);
                else rowContentRefs.current.delete(c.id);
              }}
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
