'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VerifiedBadge from '@/components/VerifiedBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Tab = 'people' | 'posts' | 'reels';

const TABS: { key: Tab; label: string }[] = [
  { key: 'people', label: 'People' },
  { key: 'posts', label: 'Posts' },
  { key: 'reels', label: 'Reels' },
];

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tab, setTab] = useState<Tab>('people');
  const [people, setPeople] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    fetchedRef.current = new Set();
    setPeople([]);
    setPosts([]);
    setReels([]);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery) return;
    const key = `${tab}:${debouncedQuery}`;
    if (fetchedRef.current.has(key)) return;
    fetchedRef.current.add(key);
    let cancelled = false;
    setLoading(true);

    const url =
      tab === 'people'
        ? `${API_URL}/api/users/search?q=${encodeURIComponent(debouncedQuery)}`
        : `${API_URL}/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${tab}&limit=20`;

    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then((result) => {
        if (cancelled || !result.success) return;
        if (tab === 'people') setPeople(result.data.users);
        else if (tab === 'posts') setPosts(result.data.posts);
        else setReels(result.data.reels);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, debouncedQuery]);

  const activeList = tab === 'people' ? people : tab === 'posts' ? posts : reels;
  const showEmpty = !loading && debouncedQuery && fetchedRef.current.has(`${tab}:${debouncedQuery}`) && activeList.length === 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-slate-100"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, posts and reels"
            className="w-full rounded-full border px-4 py-2 pr-9"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {debouncedQuery && (
        <div className="mt-4 flex items-center gap-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-[15px] ${tab === t.key ? 'font-semibold' : 'text-slate-500'}`}
            >
              {tab === t.key && <span className="h-2 w-2 rounded-full bg-sky-500" />}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-6" role="status" aria-label="Searching">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        </div>
      )}

      {!loading && debouncedQuery && tab === 'people' && (
        <div className="mt-4 space-y-2">
          {people.map((u) => (
            <Link
              key={u.id}
              href={`/u/${u.username}`}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center text-sm font-semibold text-slate-600" style={u.profilePictureUrl ? { backgroundImage: `url(${u.profilePictureUrl})` } : {}}>
                {!u.profilePictureUrl && (u.displayName?.[0]?.toUpperCase() || '?')}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-medium">{u.displayName}{u.isVerified && <VerifiedBadge />}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && debouncedQuery && tab === 'posts' && (
        <div className="mt-2 divide-y">
          {posts.map((p) => {
            const thumb = p.imageThumbUrl || p.imageMediumUrl || p.imageUrl || p.videoThumbnailUrl || null;
            return (
              <Link key={p.id} href={`/post/${p.id}`} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[15px]">{p.content}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {p.author?.displayName} · {timeAgo(p.createdAt)} · {p.likeCount} likes
                  </p>
                </div>
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" loading="lazy" />
                )}
              </Link>
            );
          })}
        </div>
      )}

      {!loading && debouncedQuery && tab === 'reels' && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {reels.map((r) => (
            <Link key={r.id} href={`/reels?id=${r.id}`}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-slate-200">
                {r.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                )}
                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </div>
              {r.caption && <p className="mt-1.5 line-clamp-1 text-sm">{r.caption}</p>}
              <p className="text-xs text-slate-500">{r.author?.displayName} · {r.likeCount} likes</p>
            </Link>
          ))}
        </div>
      )}

      {showEmpty && (
        <p className="py-6 text-slate-500">
          {tab === 'people' ? 'No users found.' : tab === 'posts' ? 'No posts found.' : 'No reels found.'}
        </p>
      )}
    </div>
  );
}
