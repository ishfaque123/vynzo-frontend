'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { useInFrianzoAppChecked } from '@/lib/useInFrianzoApp';
import { fetchMyBoosts, boostPurposeLabel, type Boost } from '@/lib/api/boostApi';

// My Boosts (web) — mirrors the native MyBoostsScreen: status chips,
// the admin note on rejections, the results line (views + new
// followers during the boost window) and "Boost Again" on finished
// boosts, which reopens the Boost page with the item, purpose, daily
// budget and duration preselected.
//
// APP GATE (owner rule): same as /boost — renders nothing until the
// FrianzoNative bridge check resolves, and redirects home in a normal
// browser.

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function dateLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.length >= 10 ? iso.slice(0, 10) : iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function StatusChip({ b }: { b: Boost }) {
  switch (b.status) {
    case 'pending':
      return <span className="shrink-0 whitespace-nowrap rounded-md bg-amber-100 px-2 py-[3px] text-[11px] font-semibold text-amber-800">In Review</span>;
    case 'approved': {
      const ends = dateLabel(b.endsAt);
      return (
        <span className="shrink-0 whitespace-nowrap rounded-md bg-blue-600 px-2 py-[3px] text-[11px] font-semibold text-white">
          Active{ends ? ` · ends ${ends}` : ''}
        </span>
      );
    }
    case 'rejected':
      return <span className="shrink-0 whitespace-nowrap rounded-md bg-red-100 px-2 py-[3px] text-[11px] font-semibold text-red-800">Rejected</span>;
    case 'expired':
      return <span className="shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-2 py-[3px] text-[11px] font-semibold text-slate-500">Ended</span>;
    default:
      return <span className="shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-2 py-[3px] text-[11px] font-semibold text-slate-500">{b.status}</span>;
  }
}

function BoostRow({ b }: { b: Boost }) {
  const isReel = b.contentType === 'reel';
  const thumb = isReel ? b.reel?.thumbnailUrl : b.post?.imageUrl;
  const rawText = isReel ? b.reel?.caption : b.post?.content;
  const text = rawText && rawText.trim() ? rawText : isReel ? 'Reel' : 'Post';
  const contentId = (isReel ? b.reelId : b.postId) || '';
  const againHref = `/boost?type=${b.contentType}&id=${encodeURIComponent(contentId)}&purpose=${encodeURIComponent(b.purpose)}&days=${b.planDays}${b.dailyBudget ? `&budget=${b.dailyBudget}` : ''}`;
  return (
    <div className="border-b border-slate-100 px-4 py-3">
      <div className="flex items-center gap-3">
        {thumb && <img src={thumb} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm text-slate-900">{text}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {b.dailyBudget
              ? `Rs ${fmt(b.dailyBudget)}/day · ${b.planDays === 1 ? '1 day' : `${b.planDays} days`} · Rs ${fmt(b.amountPkr)} · ${boostPurposeLabel(b.purpose)}`
              : `${b.planDays === 1 ? '1 day' : `${b.planDays} days`} · Rs {fmt(b.amountPkr)} · ${boostPurposeLabel(b.purpose)}`}
          </p>
          {b.linkUrl && (
            <p className="mt-0.5 truncate text-xs text-slate-500">
              Button: {b.buttonText || 'Learn More'} · {b.linkUrl}
            </p>
          )}
        </div>
        <StatusChip b={b} />
      </div>
      {b.status === 'rejected' && b.adminNote && <p className="pt-1.5 text-xs text-red-800">Note: {b.adminNote}</p>}
      {b.results && (
        <p className="pt-1.5 text-[13px] font-semibold text-blue-600">
          {b.results.views !== null && b.results.views !== undefined ? `Views: ${fmt(b.results.views)} · ` : ''}New followers: {fmt(b.results.followers)}
        </p>
      )}
      {(b.status === 'expired' || b.status === 'rejected') && contentId && (
        <Link
          href={againHref}
          className="mt-2 inline-flex h-11 items-center rounded-full border border-slate-300 px-4 text-[13px] font-medium text-blue-600"
        >
          Boost Again
        </Link>
      )}
    </div>
  );
}

export default function MyBoostsPage() {
  const router = useRouter();
  const { checked: appChecked, inApp } = useInFrianzoAppChecked();
  const { user, loading: authLoading } = useAuth();
  const [boosts, setBoosts] = useState<Boost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appChecked && !inApp) router.replace('/');
  }, [appChecked, inApp, router]);

  useEffect(() => {
    if (inApp && !authLoading && !user) router.replace('/login');
  }, [inApp, authLoading, user, router]);

  async function load() {
    try {
      const r = await fetchMyBoosts();
      if (r.success) {
        setBoosts(r.data?.boosts || []);
        setError(null);
      } else {
        setError(r.error?.message || 'Could not load your boosts');
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load your boosts');
    }
  }

  useEffect(() => {
    if (inApp && user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inApp, user]);

  // Render nothing until the app check has resolved (no flash in a
  // browser); the redirect effect handles the browser case.
  if (!appChecked || !inApp) return null;
  if (authLoading || !user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-1 border-b border-slate-100 px-1 py-1">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="rounded-full p-2 text-slate-700">
          <BackIcon />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">My Boosts</h1>
      </div>

      {boosts === null && error === null ? (
        <div className="flex justify-center py-16" role="status" aria-label="Loading your boosts">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      ) : error !== null ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              void load();
            }}
            className="mt-3 flex h-12 items-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : boosts !== null && boosts.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-slate-500">No boosts yet. Open one of your posts or reels and tap Boost.</p>
      ) : (
        <div>
          {(boosts || []).map((b) => (
            <BoostRow key={b.id} b={b} />
          ))}
        </div>
      )}
    </div>
  );
}
