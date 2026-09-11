'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  fetchNotifications,
  markAllNotificationsRead,
  deleteNotifications,
  deleteAllNotifications,
} from '@/lib/api/notificationApi';

interface Actor {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
}
interface Notification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  postId?: string | null;
  commentId?: string | null;
  actor: Actor | null;
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
      return { icon: <HeartIcon />, bg: 'bg-red-100', color: 'text-red-600' };
    case 'post_comment':
    case 'comment_reply':
      return { icon: <CommentIcon />, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'post_share':
      return { icon: <ShareIcon />, bg: 'bg-green-100', color: 'text-green-600' };
    case 'new_device_login':
      return { icon: <DeviceIcon />, bg: 'bg-amber-100', color: 'text-amber-600' };
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
    case 'new_device_login':
      return 'New login detected on your account';
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  useEffect(() => {
    fetchNotifications().then((result) => {
      if (result.success) setNotifications(result.data.notifications);
      setLoading(false);
      markAllNotificationsRead();
    });
  }, []);

  function startLongPress(id: string) {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setSelectMode(true);
      setSelectedIds(new Set([id]));
    }, LONG_PRESS_MS);
  }

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleItemClick(n: Notification, e: React.MouseEvent) {
    if (longPressFired.current) {
      longPressFired.current = false;
      e.preventDefault();
      return;
    }
    if (selectMode) {
      e.preventDefault();
      toggleSelected(n.id);
    }
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
    if (!confirm('Delete all notifications? This cannot be undone.')) return;
    setDeleting(true);
    const result = await deleteAllNotifications();
    setDeleting(false);
    if (result.success) {
      setNotifications([]);
      exitSelectMode();
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-slate-500">Loading...</p>;
  }

  if (notifications.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="text-slate-300">
          <BellEmptyIcon />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Notifications</h1>
        <p className="mt-2 text-slate-500">You're all caught up. New activity will show up here.</p>
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
            <button onClick={handleDeleteAll} className="text-sm font-medium text-red-600">
              Clear all
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        {notifications.map((n) => {
          const { icon, bg, color } = iconFor(n.type);
          const href = hrefFor(n);
          const isSelected = selectedIds.has(n.id);
          const content = (
            <div
              onMouseDown={() => startLongPress(n.id)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={() => startLongPress(n.id)}
              onTouchEnd={cancelLongPress}
              className={`flex items-start gap-3 rounded-lg px-3 py-3 ${
                isSelected ? 'bg-blue-100' : !n.read ? 'bg-blue-50' : ''
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
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${bg} ${color}`}>
                {icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-800">{messageFor(n)}</p>
                <p className="mt-0.5 text-xs text-slate-400">{formatTime(n.createdAt)}</p>
              </div>
            </div>
          );
          return href && !selectMode ? (
            <Link key={n.id} href={href} onClick={(e) => handleItemClick(n, e)}>
              {content}
            </Link>
          ) : (
            <div key={n.id} onClick={(e) => handleItemClick(n, e)}>
              {content}
            </div>
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
    </div>
  );
}
