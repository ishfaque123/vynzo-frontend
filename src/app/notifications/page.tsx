'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  fetchNotifications,
  markAllNotificationsRead,
  deleteNotifications,
  deleteAllNotifications,
} from '@/lib/api/notificationApi';
import SkeletonNotificationRow from '@/components/SkeletonNotificationRow';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useAuth } from '@/lib/auth/useAuth';
import { saveOfflineNotifications, getOfflineNotifications } from '@/lib/offline/feedCache';

interface Actor {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  isVerified?: boolean;
}
interface Notification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  postId?: string | null;
  commentId?: string | null;
  reelId?: string | null;
  detail?: string | null;
  actor: Actor | null;
}

interface GroupedNotification {
  key: string;
  type: string;
  actor: Actor | null;
  items: Notification[];
  latest: Notification;
  hasUnread: boolean;
}

// System notifications are never grouped — each one carries its own message
// (e.g. the moderation reason) that must stay visible.
const NEVER_GROUP = new Set([
  'comment_removed',
  'post_removed',
  'reel_removed',
  'messaging_restricted',
  'new_device_login',
  'account_restricted',
  'account_banned',
  'verification_approved',
  'verification_rejected',
]);

// Group consecutive same-actor + same-type notifications (e.g. 9 reel likes
// from one person become a single "liked 9 of your reels" row).
function groupNotifications(list: Notification[]): GroupedNotification[] {
  const groups: GroupedNotification[] = [];
  for (const n of list) {
    const actorId = n.actor?.id || 'none';
    // System types get a unique key so they never merge with anything
    const key = NEVER_GROUP.has(n.type) ? `${n.type}:${actorId}:${n.id}` : `${n.type}:${actorId}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(n);
      if (!n.read) last.hasUnread = true;
      if (new Date(n.createdAt).getTime() > new Date(last.latest.createdAt).getTime()) {
        last.latest = n;
      }
    } else {
      groups.push({ key, type: n.type, actor: n.actor, items: [n], latest: n, hasUnread: !n.read });
    }
  }
  return groups;
}

function groupMessage(g: GroupedNotification): string {
  const count = g.items.length;
  if (count === 1) return messageFor(g.latest);
  const name = g.actor?.displayName || g.actor?.username || 'Someone';
  switch (g.type) {
    case 'post_like':
      return `${name} liked ${count} of your posts`;
    case 'reel_like':
      return `${name} liked ${count} of your reels`;
    case 'post_comment':
      return `${name} commented on ${count} of your posts`;
    case 'reel_comment':
      return `${name} commented on ${count} of your reels`;
    case 'comment_like':
      return `${name} liked ${count} of your comments`;
    case 'comment_reply':
      return `${name} replied ${count} times to your comments`;
    case 'post_share':
      return `${name} shared ${count} of your posts`;
    case 'follow':
      return `${name} and ${count - 1} others started following you`;
    default:
      return `${name} sent you ${count} notifications`;
  }
}

function FollowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" />
      <path d="M18 8v6M15 11h6" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 7c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
function DeviceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}
function BellEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 003.4 0" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function iconFor(type: string) {
  switch (type) {
    case 'follow':
      return { icon: <FollowIcon />, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'post_like':
    case 'comment_like':
    case 'reel_like':
      return { icon: <HeartIcon />, bg: 'bg-red-100', color: 'text-red-600' };
    case 'post_comment':
    case 'comment_reply':
    case 'reel_comment':
    case 'reel_reply':
    case 'comment_mention':
      return { icon: <CommentIcon />, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'post_share':
      return { icon: <ShareIcon />, bg: 'bg-green-100', color: 'text-green-600' };
    case 'new_device_login':
      return { icon: <DeviceIcon />, bg: 'bg-amber-100', color: 'text-amber-600' };
    case 'comment_removed':
    case 'post_removed':
      return { icon: <BellEmptyIcon />, bg: 'bg-red-100', color: 'text-red-600' };
    default:
      return { icon: <BellEmptyIcon />, bg: 'bg-slate-100', color: 'text-slate-600' };
  }
}

function messageFor(n: Notification): string {
  const name = n.actor?.displayName || n.actor?.username || 'Someone';
  switch (n.type) {
    case 'follow':
      return `${name} started following you`;
    case 'post_like':
      return `${name} liked your post`;
    case 'post_comment':
      return `${name} commented on your post`;
    case 'comment_like':
      return `${name} liked your comment`;
    case 'comment_reply':
      return `${name} replied to your comment`;
    case 'post_share':
      return `${name} shared your post`;
    case 'reel_like':
      return `${name} liked your reel`;
    case 'reel_comment':
      return `${name} commented on your reel`;
    case 'reel_reply':
      return `${name} replied to your comment on a reel`;
    case 'comment_mention':
      return n.commentId ? `${name} mentioned you in a comment` : `${name} tagged you in a post`;
    case 'new_device_login':
      return 'New login detected on your account';
    case 'comment_removed':
      return `Your comment was removed${n.detail ? ` for ${n.detail}` : ''}`;
    case 'post_removed':
      return `Your post was removed${n.detail ? ` for ${n.detail}` : ''}`;
    case 'reel_removed':
      return `Your reel was removed${n.detail ? ` for ${n.detail}` : ''}`;
    case 'messaging_restricted':
      return n.detail ? `Messaging restricted: ${n.detail}` : 'Messaging restricted';
    default:
      return 'New notification';
  }
}

function hrefFor(n: Notification): string | null {
  switch (n.type) {
    case 'follow':
      return n.actor?.username ? `/u/${n.actor.username}` : null;
    case 'post_like':
    case 'post_comment':
    case 'comment_like':
    case 'comment_reply':
    case 'post_share':
      return n.postId ? `/post/${n.postId}` : null;
    case 'reel_like':
    case 'reel_comment':
    case 'reel_reply':
      return n.reelId ? `/reels?id=${n.reelId}` : '/reels';
    case 'comment_mention':
      return n.postId ? `/post/${n.postId}` : null;
    case 'comment_removed':
      return n.postId ? `/post/${n.postId}` : null; // the post still exists — shows context
    case 'post_removed':
    case 'reel_removed':
    case 'messaging_restricted':
      return '/community-guidelines'; // content is gone — show the rules instead
    default:
      return null;
  }
}

function formatTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

const LONG_PRESS_MS = 500;
const SWIPE_THRESHOLD = -80; // px dragged left to trigger delete
const MAX_DRAG = -110; // px, how far the row can visually slide before release
const UNDO_WINDOW_MS = 4000;

// Blocks the browser's native long-press callout/selection menu without
// touching normal vertical scrolling.
const noCalloutStyle: React.CSSProperties = {
  WebkitTouchCallout: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none',
  touchAction: 'pan-y',
};

function NotificationRow({
  g,
  href,
  selectMode,
  isSelected,
  onEnterSelectMode,
  onToggleSelected,
  onSwipeDelete,
}: {
  g: GroupedNotification;
  href: string | null;
  selectMode: boolean;
  isSelected: boolean;
  onEnterSelectMode: (ids: string[]) => void;
  onToggleSelected: (ids: string[]) => void;
  onSwipeDelete: (g: GroupedNotification) => void;
}) {
  const n = g.latest;
  const ids = g.items.map((x) => x.id);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const axisLocked = useRef<'x' | 'y' | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureHandled = useRef(false); // true if long-press or swipe fired, so the click should be ignored

  function clearLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (selectMode) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    axisLocked.current = null;
    gestureHandled.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      gestureHandled.current = true;
      onEnterSelectMode(ids);
    }, LONG_PRESS_MS);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (selectMode) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (axisLocked.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (axisLocked.current === 'x') {
      clearLongPress();
      const clamped = Math.max(MAX_DRAG * 1.3, Math.min(0, dx));
      setDragX(clamped);
      setDragging(true);
    } else if (axisLocked.current === 'y') {
      clearLongPress();
    }
  }

  function handleTouchEnd() {
    clearLongPress();
    setDragging(false);
    if (axisLocked.current === 'x') {
      if (dragX <= SWIPE_THRESHOLD) {
        gestureHandled.current = true;
        setDragX(-500);
        setTimeout(() => onSwipeDelete(g), 160);
      } else {
        setDragX(0);
      }
    }
    axisLocked.current = null;
  }

  function handleMouseDown() {
    if (selectMode) return;
    gestureHandled.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      gestureHandled.current = true;
      onEnterSelectMode(ids);
    }, LONG_PRESS_MS);
  }
  function handleMouseUpOrLeave() {
    clearLongPress();
  }

  function handleClick(e: React.MouseEvent) {
    if (gestureHandled.current) {
      gestureHandled.current = false;
      e.preventDefault();
      return;
    }
    if (selectMode) {
      e.preventDefault();
      onToggleSelected(ids);
    }
  }

  const { icon, bg, color } = iconFor(n.type);
  const content = (
    <div
      className={`flex items-start gap-3 rounded-lg px-3 py-3 ${
        isSelected ? 'bg-blue-100' : g.hasUnread ? 'bg-blue-50' : 'bg-white'
      }`}
    >
      {selectMode && (
        <span
          className={`mt-1.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
          }`}
        >
          {isSelected && <CheckIcon />}
        </span>
      )}
      {n.actor?.profilePictureUrl ? (
        <span className="relative flex-shrink-0">
          <img
            src={n.actor.profilePictureUrl}
            alt={n.actor.displayName || n.actor.username || ''}
            className="h-9 w-9 rounded-full object-cover"
          />
          {n.actor.isVerified && (
            <span className="absolute -bottom-0.5 -right-0.5">
              <VerifiedBadge size="sm" />
            </span>
          )}
        </span>
      ) : (
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${bg} ${color}`}>
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm text-slate-800">{groupMessage(g)}</p>
        <p className="mt-0.5 text-xs text-slate-400">{formatTime(n.createdAt)}</p>
      </div>
      {g.hasUnread && !selectMode && (
        <span className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-600" aria-label="Unread" />
      )}
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 flex items-center justify-end rounded-lg bg-red-600 pr-5 text-white">
        <TrashIcon />
      </div>
      <div
        style={{ transform: `translateX(${dragX}px)`, transition: dragging ? 'none' : 'transform 0.2s ease', ...noCalloutStyle }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onContextMenu={(e) => e.preventDefault()}
      >
        {href && !selectMode ? (
          <Link href={href} onClick={handleClick}>{content}</Link>
        ) : (
          <div onClick={handleClick}>{content}</div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [filter, setFilter] = useState<'all' | 'likes' | 'comments' | 'follows'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<{ key: string; ids: string[]; items: Notification[]; timer: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchNotifications();
        if (cancelled) return;
        if (result.success) {
          setNotifications(result.data.notifications);
          setOfflineMode(false);
          if (user?.id) saveOfflineNotifications(user.id, result.data.notifications).catch(() => {});
        } else {
          throw new Error('fetch failed');
        }
      } catch {
        if (cancelled) return;
        // Offline: show cached notifications like Facebook does
        if (user?.id) {
          const cached = await getOfflineNotifications<Notification>(user.id);
          if (cached && cached.length > 0) {
            setNotifications(cached);
            setOfflineMode(true);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  async function handleMarkAllRead() {
    const result = await markAllNotificationsRead();
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'likes', label: 'Likes' },
    { value: 'comments', label: 'Comments' },
    { value: 'follows', label: 'Follows' },
  ] as const;

  function matchesFilter(g: GroupedNotification): boolean {
    if (filter === 'all') return true;
    if (filter === 'likes') return g.type.endsWith('_like');
    if (filter === 'comments') return g.type.includes('comment') || g.type.includes('reply') || g.type.includes('mention');
    if (filter === 'follows') return g.type === 'follow';
    return true;
  }

  const visibleGroups = groupNotifications(notifications).filter(matchesFilter);
  const unreadCount = notifications.filter((n) => !n.read).length;

  function enterSelectMode(ids: string[]) {
    setSelectMode(true);
    setSelectedIds(new Set(ids));
  }

  function toggleSelected(ids: string[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function handleSelectAll() {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0 || deleting) return;
    setDeleting(true);
    const ids = Array.from(selectedIds);
    const result = await deleteNotifications(ids);
    setDeleting(false);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      exitSelectMode();
    }
  }

  async function handleDeleteAll() {
    if (deleting || notifications.length === 0) return;
    const backup = notifications;
    setNotifications([]);
    exitSelectMode();
    setDeleting(true);
    const result = await deleteAllNotifications();
    setDeleting(false);
    if (!result.success) {
      setNotifications(backup);
    }
  }

  // Swipe-to-delete: remove instantly from the list, but only call the API
  // after the undo window closes so "Undo" can put it back for free.
  function handleSwipeDelete(g: GroupedNotification) {
    const ids = g.items.map((x) => x.id);
    if (pendingUndo) {
      clearTimeout(pendingUndo.timer);
      deleteNotifications(pendingUndo.ids);
    }
    setNotifications((prev) => prev.filter((x) => !ids.includes(x.id)));
    const timer = setTimeout(() => {
      deleteNotifications(ids);
      setPendingUndo((cur) => (cur && cur.key === g.key ? null : cur));
    }, UNDO_WINDOW_MS);
    setPendingUndo({ key: g.key, ids, items: g.items, timer });
  }

  function handleUndo() {
    if (!pendingUndo) return;
    clearTimeout(pendingUndo.timer);
    const restored = pendingUndo.items;
    setNotifications((prev) => [...restored, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setPendingUndo(null);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-0.5 px-2 py-2" role="status" aria-label="Loading notifications">
        <SkeletonNotificationRow />
        <SkeletonNotificationRow />
        <SkeletonNotificationRow />
        <SkeletonNotificationRow />
        <SkeletonNotificationRow />
      </div>
    );
  }

  if (visibleGroups.length === 0 && !pendingUndo && !loading) {
    return (
      <div className="mx-auto max-w-xl px-2 py-2 pb-20">
        <div className="flex items-center justify-between px-2 py-2">
          <h1 className="text-lg font-semibold">Notifications</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto px-2 py-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === f.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <div className="text-slate-300">
            <BellEmptyIcon />
          </div>
          <p className="mt-2 text-slate-500">
            {filter === 'all' ? "You're all caught up. New activity will show up here." : `No ${filter} notifications yet.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-2 py-2 pb-20">
      <div className="flex items-center justify-between px-2 py-2">
        {selectMode ? (
          <>
            <button onClick={exitSelectMode} aria-label="Cancel selection" className="p-1 text-slate-600">
              <CloseIcon />
            </button>
            <span className="text-sm font-medium text-slate-700">{selectedIds.size} selected</span>
            <button onClick={handleSelectAll} className="text-sm font-medium text-blue-600">
              {selectedIds.size === notifications.length ? 'Unselect all' : 'Select all'}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Notifications</h1>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-sm font-medium text-blue-600">
                  Mark all read
                </button>
              )}
              <button onClick={handleDeleteAll} className="text-sm font-medium text-red-600">
                Clear all
              </button>
            </div>
          </>
        )}
      </div>

      {offlineMode && (
        <div className="mx-2 mb-1 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700">
          You're offline — showing saved notifications
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto px-2 py-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-0.5">
        {visibleGroups.map((g) => {
          const ids = g.items.map((x) => x.id);
          const allSelected = ids.every((id) => selectedIds.has(id));
          return (
            <NotificationRow
              key={g.key}
              g={g}
              href={hrefFor(g.latest)}
              selectMode={selectMode}
              isSelected={allSelected}
              onEnterSelectMode={enterSelectMode}
              onToggleSelected={toggleSelected}
              onSwipeDelete={handleSwipeDelete}
            />
          );
        })}
      </div>

      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white p-3">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0 || deleting}
            className="mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-full bg-red-600 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            <TrashIcon />
            {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
          </button>
        </div>
      )}

      {pendingUndo && (
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <div className="flex max-w-sm items-center gap-3 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
            <span>Notification deleted</span>
            <button onClick={handleUndo} className="font-semibold text-blue-400">Undo</button>
          </div>
        </div>
      )}
    </div>
  );
}
