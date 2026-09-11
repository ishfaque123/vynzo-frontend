'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchNotifications, markAllNotificationsRead } from '@/lib/api/notificationApi';

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications().then((result) => {
      if (result.success) setNotifications(result.data.notifications);
      setLoading(false);
      markAllNotificationsRead();
    });
  }, []);

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
    <div className="mx-auto max-w-xl px-2 py-2">
      <h1 className="px-2 py-2 text-lg font-semibold">Notifications</h1>
      <div className="flex flex-col gap-0.5">
        {notifications.map((n) => {
          const { icon, bg, color } = iconFor(n.type);
          const href = hrefFor(n);
          const content = (
            <div
              className={`flex items-start gap-3 rounded-lg px-3 py-3 ${
                !n.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${bg} ${color}`}>
                {icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-800">{messageFor(n)}</p>
                <p className="mt-0.5 text-xs text-slate-400">{formatTime(n.createdAt)}</p>
              </div>
            </div>
          );
          return href ? (
            <Link key={n.id} href={href}>
              {content}
            </Link>
          ) : (
            <div key={n.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
