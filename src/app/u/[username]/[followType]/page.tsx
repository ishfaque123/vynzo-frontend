'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchUserProfile, fetchFollowUsers, toggleFollow } from '@/lib/api/userApi';
import VerifiedBadge from '@/components/VerifiedBadge';
import Skeleton from '@/components/Skeleton';

type FollowUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  profilePictureUrl: string | null;
  isVerified: boolean;
  isFollowing: boolean;
};

// Same rule as ProfileClient: full number below 10,000, K/M/B from 10,000 up.
function formatCount(n: number) {
  if (n < 10000) return n.toLocaleString('en-US');
  if (n < 1000000) { const k = Math.round(n / 100) / 10; return k >= 1000 ? '1M' : `${k % 1 === 0 ? k : k.toFixed(1)}k`; }
  if (n < 1000000000) { const m = Math.round(n / 100000) / 10; return m >= 1000 ? '1B' : `${m % 1 === 0 ? m : m.toFixed(1)}M`; }
  const b = Math.round(n / 100000000) / 10; return `${b % 1 === 0 ? b : b.toFixed(1)}B`;
}

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
  const [search, setSearch] = useState('');
  // Final5 (owner 2026-11-26): the search box is gone from the page —
  // search lives behind the search icon in the top row only.
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const profileResult = profile
          ? { success: true, data: { user: profile } }
          : await fetchUserProfile(username);

        if (cancelled) return;
        if (!profileResult.success) {
          setError(true);
          setLoading(false);
          return;
        }

        setProfile(profileResult.data.user);
        const result = await fetchFollowUsers(profileResult.data.user.id, type, page, 20);
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
    return (
      <div className="mx-auto max-w-xl pb-6" role="status" aria-label={type === 'followers' ? 'Loading followers' : 'Loading following'}>
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="mx-auto h-5 w-40 max-w-[50%]" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="divide-y divide-slate-100 bg-white">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32 max-w-[70%]" />
                <Skeleton className="h-3.5 w-24 max-w-[55%]" />
              </div>
              <Skeleton className="h-9 w-20 shrink-0 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
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
      {/* Final5 (owner 2026-11-26, approved example final5.png): top row is
          back arrow '<' left, the user's FULL NAME (displayName from the
          profile data — never hardcoded, never the @username) in the
          middle, search icon right. The back button itself is unchanged. */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm">
        <button onClick={() => router.back()} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition-all duration-150 hover:bg-slate-100 active:scale-95">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="min-w-0 flex-1 truncate text-center text-lg font-semibold text-slate-900">{profile?.displayName || ''}</span>
        <button
          onClick={() => { if (searchOpen) setSearch(''); setSearchOpen((o) => !o); }}
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition-all duration-150 hover:bg-slate-100 active:scale-95"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </div>

      {users.length === 0 ? (
        <p className="px-4 py-12 text-center text-slate-500">No {title.toLowerCase()} yet.</p>
      ) : (
        <>
          {/* Search lives behind the search icon only (final5): the box
              appears when the icon is tapped, and closes + clears here. */}
          {searchOpen && (
            <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${title.toLowerCase()}...`}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
              <button
                onClick={() => { setSearch(''); setSearchOpen(false); }}
                aria-label="Close search"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 transition-all duration-150 hover:bg-slate-100 active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <span className="text-lg font-semibold text-slate-900">{title}</span>
            <span className="text-lg font-semibold text-slate-900">{formatCount(pagination.total)}</span>
          </div>
          <div className="divide-y">
          {users
            .filter((user) => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return (
                user.displayName?.toLowerCase().includes(q) ||
                user.username?.toLowerCase().includes(q)
              );
            })
            .map((user) => (
            <div key={user.id} className="flex items-center gap-3 bg-white px-4 py-3 text-slate-900 transition-colors hover:bg-slate-50">
              <Link href={user.username ? `/u/${encodeURIComponent(user.username)}` : '#'} className="shrink-0">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                  {user.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.displayName?.[0]?.toUpperCase() || '?'
                  )}
                </div>
              </Link>

              <Link href={user.username ? `/u/${encodeURIComponent(user.username)}` : '#'} className="min-w-0 flex-1 no-underline">
                <div className="flex items-center gap-1">
                  <span className="truncate font-medium text-slate-900 no-underline">{user.displayName || user.username || 'User'}</span>
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
        </>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevious}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-150 hover:bg-slate-50 active:scale-95 disabled:opacity-40"
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
