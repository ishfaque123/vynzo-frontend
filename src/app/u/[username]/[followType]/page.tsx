'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchUserProfile, fetchFollowUsers, toggleFollow } from '@/lib/api/userApi';
import VerifiedBadge from '@/components/VerifiedBadge';

type FollowUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  profilePictureUrl: string | null;
  isVerified: boolean;
  isFollowing: boolean;
};

export default function FollowListPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const rawType = params.followType as string;
  const type = rawType === 'following' ? 'following' : 'followers';
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0, hasNext: false, hasPrevious: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [profileResult, listResult] = await Promise.all([
          fetchUserProfile(username),
          profile ? Promise.resolve(null) : fetchUserProfile(username),
        ]);

        if (cancelled) return;
        if (!profileResult.success) {
          setError(true);
          setLoading(false);
          return;
        }

        setProfile(profileResult.data.user);
        const result = listResult ?? await fetchFollowUsers(profileResult.data.user.id, type, page, 20);
        if (!result.success) {
          setError(true);
        } else {
          setUsers(result.data.users || []);
          setPagination(result.data.pagination || { pages: 1, total: 0, hasNext: false, hasPrevious: false });
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [username, type, page]);

  async function handleFollow(userId: string) {
    if (busyId) return;
    setBusyId(userId);
    const result = await toggleFollow(userId);
    if (result.success) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isFollowing: result.data.following } : u));
    } else {
      alert(result.error?.message || 'Could not update follow.');
    }
    setBusyId(null);
  }

  if (loading) {
    return <div className="mx-auto max-w-xl p-6 text-center text-slate-500">Loading...</div>;
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <p className="text-slate-500">Could not load this list.</p>
        <button onClick={() => window.location.reload()} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Try again</button>
      </div>
    );
  }

  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <div className="mx-auto max-w-xl pb-6">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <button onClick={() => router.back()} aria-label="Go back" className="p-1 text-slate-700">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="font-semibold">{title}</h1>
          <p className="truncate text-xs text-slate-500">@{profile.username}</p>
        </div>
      </div>

      {users.length === 0 ? (
        <p className="px-4 py-12 text-center text-slate-500">No {title.toLowerCase()} yet.</p>
      ) : (
        <div className="divide-y">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={user.username ? `/u/${encodeURIComponent(user.username)}` : '#'} className="shrink-0">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                  {user.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.displayName?.[0]?.toUpperCase() || '?'
                  )}
                </div>
              </Link>

              <Link href={user.username ? `/u/${encodeURIComponent(user.username)}` : '#'} className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate font-medium text-slate-900">{user.displayName || user.username || 'User'}</span>
                  {user.isVerified && <VerifiedBadge size="sm" />}
                </div>
                {user.username && <p className="truncate text-sm text-slate-500">@{user.username}</p>}
              </Link>

              {currentUser?.id !== user.id && (
                <button
                  onClick={() => handleFollow(user.id)}
                  disabled={busyId === user.id}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${user.isFollowing ? 'border border-slate-300 bg-white text-slate-700' : 'bg-slate-900 text-white'}`}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevious}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {pagination.pages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNext}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
