'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchMessageRequests } from '@/lib/api/messageApi';
import VerifiedBadge from '@/components/VerifiedBadge';
import Avatar from '@/components/Avatar';

function formatConversationTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86400000);
  if (dayDiff <= 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function MessageRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  function loadRequests() {
    setLoading(true);
    setLoadError(false);
    fetchMessageRequests()
      .then((result) => {
        if (result.success) setRequests(result.data || []);
        else setLoadError(true);
        setLoading(false);
      })
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => router.push('/messages')} aria-label="Back" className="p-1 text-slate-600">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-semibold">Message Requests</h1>
      </div>

      <p className="px-4 pb-3 text-xs text-slate-400">
        Messages from people you don't follow. They won't know you've seen their messages until you accept.
      </p>

      {loading && (
        <div className="flex flex-col gap-3 px-4" role="status" aria-label="Loading message requests">
          {[1, 2, 3].map((item) => (
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
          <p className="text-sm font-semibold text-slate-800">Couldn't load message requests</p>
          <p className="mt-1 text-xs text-slate-500">Check your connection and try again.</p>
          <button onClick={loadRequests} className="mt-3 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white">Retry</button>
        </div>
      )}

      {!loading && !loadError && requests.length === 0 && (
        <p className="px-4 text-slate-500">No message requests.</p>
      )}

      <div className="divide-y">
        {requests.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className="flex items-center gap-3 bg-white px-4 py-3 hover:bg-slate-50"
          >
            <div className="relative flex-shrink-0">
              <Avatar url={c.otherUser?.profilePictureUrl} name={c.otherUser?.displayName || c.otherUser?.username} px={48} />
              {c.otherUser?.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
              )}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="flex items-center gap-1 truncate font-medium text-slate-700">
                <span className="truncate">{c.otherUser?.displayName || c.otherUser?.username}</span>
                {c.otherUser?.isVerified && <VerifiedBadge size="sm" />}
              </p>
              <p className="truncate text-sm text-slate-500">
                {c.lastMessage
                  ? c.lastMessage.isDeleted
                    ? 'This message was deleted'
                    : c.lastMessage.mediaType === 'image'
                    ? 'Photo'
                    : c.lastMessage.mediaType === 'voice'
                    ? 'Voice message'
                    : c.lastMessage.content || 'Say hi'
                  : 'Say hi 👋'}
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
              <span className="text-xs text-slate-400">{formatConversationTime(c.updatedAt)}</span>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
