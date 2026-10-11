'use client';

import { useEffect, useState } from 'react';
import { getMutedStories, unmuteStories } from '@/lib/api/statusApi';

interface MutedUser {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
}

export default function MutedStoriesPage() {
  const [users, setUsers] = useState<MutedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    getMutedStories().then((result) => {
      if (result.success) setUsers(result.data.muted || []);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUnmute(id: string) {
    if (busyId) return;
    setBusyId(id);
    const result = await unmuteStories(id);
    setBusyId(null);
    if (result.success) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-4">
      <h1 className="mb-1 text-lg font-bold text-slate-900">Muted Stories</h1>
      <p className="mb-4 text-sm text-slate-500">
        You won't see stories from these accounts in your feed. They won't know you muted them.
      </p>
      {users.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No muted stories.</p>
      ) : (
        <div className="divide-y rounded-2xl border bg-white">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="h-11 w-11 flex-shrink-0 rounded-full bg-slate-200 bg-cover bg-center"
                style={u.profilePictureUrl ? { backgroundImage: `url(${u.profilePictureUrl})` } : {}}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{u.displayName || u.username}</p>
                <p className="truncate text-xs text-slate-500">@{u.username}</p>
              </div>
              <button
                onClick={() => handleUnmute(u.id)}
                disabled={busyId === u.id}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {busyId === u.id ? '...' : 'Unmute'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
