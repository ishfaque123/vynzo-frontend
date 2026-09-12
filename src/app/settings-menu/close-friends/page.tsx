'use client';

import { useEffect, useState } from 'react';
import { fetchCloseFriendCandidates, addCloseFriend, removeCloseFriend } from '@/lib/api/closeFriendApi';
import { StarIcon } from '@/components/icons/UiIcons';

interface Candidate {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  isCloseFriend: boolean;
}

function Avatar({ url, name }: { url?: string; name?: string }) {
  return (
    <div
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center font-semibold text-slate-600"
      style={url ? { backgroundImage: `url(${url})` } : {}}
    >
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

export default function CloseFriendsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchCloseFriendCandidates().then((result) => {
      if (result.success) setCandidates(result.data.users);
      setLoading(false);
    });
  }, []);

  async function toggle(user: Candidate) {
    if (busyId) return;
    setBusyId(user.id);
    const result = user.isCloseFriend ? await removeCloseFriend(user.id) : await addCloseFriend(user.id);
    setBusyId(null);
    if (result.success) {
      setCandidates((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isCloseFriend: !u.isCloseFriend } : u))
      );
    }
  }

  if (loading) return <p className="py-10 text-center text-slate-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-xl px-4 py-4 pb-20">
      <div className="mb-4 flex flex-col items-center text-center">
        <div className="text-green-500"><StarIcon size={40} /></div>
        <h1 className="mt-2 text-lg font-semibold">Close Friends</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add people you follow to your Close Friends list.
        </p>
      </div>

      {candidates.length === 0 ? (
        <p className="py-10 text-center text-slate-500">
          You need to follow people before you can add them as close friends.
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {candidates.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
              <Avatar url={user.profilePictureUrl} name={user.displayName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{user.displayName || user.username}</p>
                <p className="truncate text-xs text-slate-500">@{user.username}</p>
              </div>
              <button
                onClick={() => toggle(user)}
                disabled={busyId === user.id}
                aria-label={user.isCloseFriend ? 'Remove from close friends' : 'Add to close friends'}
                className={`flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-40 ${
                  user.isCloseFriend ? 'border-green-500 bg-green-50 text-green-500' : 'border-slate-300 text-slate-400'
                }`}
              >
                <StarIcon size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
