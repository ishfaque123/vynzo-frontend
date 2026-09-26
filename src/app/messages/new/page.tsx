'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createConversation, fetchConversations } from '@/lib/api/messageApi';
import { fetchFollowUsers } from '@/lib/api/userApi';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_SELECTED = 12;

type ShareUser = {
  id: string;
  username?: string;
  displayName?: string;
  profilePictureUrl?: string | null;
};

export default function NewMessagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [shareUrl, setShareUrl] = useState('');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ShareUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShareUrl(params.get('share') || '');
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecipients() {
      setLoading(true);
      const [conversationsResult, followersResult, followingResult] = await Promise.all([
        fetchConversations(),
        user?.id ? fetchFollowUsers(user.id, 'followers', 1, 12).catch(() => null) : Promise.resolve(null),
        user?.id ? fetchFollowUsers(user.id, 'following', 1, 12).catch(() => null) : Promise.resolve(null),
      ]);

      const merged: ShareUser[] = [];
      const seen = new Set<string>();

      const add = (u: any) => {
        if (!u?.id || seen.has(u.id)) return;
        seen.add(u.id);
        merged.push({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          profilePictureUrl: u.profilePictureUrl,
        });
      };

      if (conversationsResult?.success) {
        for (const conversation of conversationsResult.data || []) {
          if (conversation.isGroup === false) add(conversation.otherUser);
        }
      }

      const addFollowData = (result: any) => {
        if (!result?.success) return;
        const data = result.data;
        const list = Array.isArray(data) ? data : data?.users || data?.items || [];
        for (const item of list) add(item.user || item);
      };

      addFollowData(followersResult);
      addFollowData(followingResult);

      if (!cancelled) {
        setUsers(merged.slice(0, 60));
        setLoading(false);
      }
    }

    loadRecipients();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSearch(value: string) {
    setQuery(value);
    if (!value.trim()) return;

    setSearching(true);
    const params = new URLSearchParams();
    params.set('q', value.trim());
    const res = await fetch(API_URL + '/api/users/search?' + params.toString(), {
      credentials: 'include',
    });
    const result = await res.json();
    setSearching(false);

    if (result.success) {
      setUsers(result.data.users || []);
    }
  }

  const visibleUsers = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter((u) =>
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );
  }, [users, query]);

  function toggleUser(id: string) {
    setError('');
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_SELECTED) return current;
      return [...current, id];
    });
  }

  async function sendToSelected() {
    if (!shareUrl || selectedIds.length === 0 || sending) return;

    setSending(true);
    setError('');
    const socket = getSocket();

    try {
      await Promise.all(
        selectedIds.map(async (userId) => {
          const conversationResult = await createConversation(userId);
          if (!conversationResult?.success) {
            throw new Error('Could not create a conversation.');
          }

          await new Promise<void>((resolve, reject) => {
            socket.emit(
              'message:send',
              { conversationId: conversationResult.data.id, content: shareUrl },
              (result: { success: boolean; error?: string }) => {
                if (result?.success) resolve();
                else reject(new Error(result?.error || 'Could not send message.'));
              }
            );
          });
        })
      );

      router.push('/messages');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the shared post.');
      setSending(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-white px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Send to</h1>
        <p className="mt-1 text-sm text-slate-500">Select up to {MAX_SELECTED} people</p>
      </div>

      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search people..."
        className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
        autoFocus
      />

      {searching && <p className="mt-3 text-sm text-slate-500">Searching...</p>}

      <div className="mt-4 grid grid-cols-3 gap-3">
        {loading
          ? Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-100" />
            ))
          : visibleUsers.slice(0, 60).map((u) => {
              const selected = selectedIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className="relative flex min-h-28 flex-col items-center justify-center rounded-xl border p-2 text-center"
                >
                  <div className="relative">
                    {u.profilePictureUrl ? (
                      <img src={u.profilePictureUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600">
                        {(u.displayName || u.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    {selected && (
                      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="mt-2 w-full truncate text-sm font-medium">{u.displayName || ('@' + u.username)}</span>
                  {u.username && <span className="w-full truncate text-xs text-slate-500">@{u.username}</span>}
                </button>
              );
            })}
      </div>

      {!loading && visibleUsers.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500">No people found.</p>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="sticky bottom-0 mt-5 bg-white py-3">
        <button
          type="button"
          disabled={!shareUrl || selectedIds.length === 0 || sending}
          onClick={sendToSelected}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {sending ? 'Sending...' : ('Send' + (selectedIds.length ? ' (' + selectedIds.length + ')' : ''))}
        </button>
      </div>
    </div>
  );
}
