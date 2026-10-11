'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDashboard } from '@/lib/api/userApi';
import Toast from '@/components/Toast';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-slate-100 p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4 h-7 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mb-3 h-24 animate-pulse rounded-lg bg-slate-100" />
      <div className="mb-3 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
      <div className="mb-3 h-32 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-44 animate-pulse rounded-lg bg-slate-100" />
    </div>
  );
}

type DailyView = { date: string; views: number };
type TopPerforming = {
  type: 'post' | 'reel';
  id: string;
  title: string;
  mediaUrl: string | null;
  createdAt: string;
  views: number;
};
type Monetization = {
  status: 'eligible' | 'locked';
  referrals: number;
  requiredReferrals: number;
  progress: number;
  referralLink: string;
};
type DashboardData = {
  earnings: number;
  monetization?: Monetization;
  stats: {
    views: number;
    engagement: number;
    engagementBreakdown?: { likes: number; comments: number; shares: number };
    engagementTrendPct?: number | null;
    newFollowers: number;
    followersTrendPct?: number | null;
    content: number;
    contentTrendPct?: number | null;
    dailyViews: DailyView[];
    viewsTrendPct: number | null;
    topPerforming: TopPerforming | null;
    days?: number;
  };
};

const RANGES = [7, 30, 90] as const;

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [range, setRange] = useState<number>(30);

  function load(days: number) {
    setLoading(true);
    setError(false);
    setSelectedDay(null);
    fetchDashboard(days)
      .then((result) => {
        if (result.success) setDashboard(result.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(range);
  }, [range]);

  function copyReferralLink() {
    const link = dashboard?.monetization?.referralLink;
    if (!link) return;
    navigator.clipboard.writeText(link).then(
      () => setToast({ message: 'Referral link copied.', type: 'success' }),
      () => setToast({ message: 'Could not copy link.', type: 'error' }),
    );
  }

  if (loading) return <DashboardSkeleton />;
  if (error || !dashboard) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-slate-500">Could not load dashboard. Please try again.</p>
        <button onClick={() => load(range)} className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white">
          Try again
        </button>
      </div>
    );
  }

  const stats = dashboard.stats;
  const monetization = dashboard.monetization;
  const dailyViews = stats?.dailyViews || [];
  const maxViews = Math.max(1, ...dailyViews.map((d) => d.views));
  const points = dailyViews
    .map((d, i) => {
      const x = dailyViews.length > 1 ? (i / (dailyViews.length - 1)) * 320 : 0;
      const y = 85 - (d.views / maxViews) * 75;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const totalViews30d = dailyViews.reduce((sum, d) => sum + d.views, 0);
  const selectedView = selectedDay === null ? null : dailyViews[selectedDay] || null;
  const trend = stats?.viewsTrendPct;
  const trendText =
    trend === null || trend === undefined
      ? null
      : `${trend > 0 ? '+' : ''}${trend}%`;
  const engTrend = stats?.engagementTrendPct;
  const engTrendText =
    engTrend === null || engTrend === undefined
      ? null
      : `${engTrend > 0 ? '+' : ''}${engTrend}%`;
  function trendClass(v: number) {
    return `mt-1 text-sm font-semibold ${v >= 0 ? 'text-blue-600' : 'text-red-500'}`;
  }
  function trendLabel(v: number | null | undefined) {
    if (v === null || v === undefined) return null;
    return `${v > 0 ? '+' : ''}${v}%`;
  }
  const topLink = stats?.topPerforming
    ? stats.topPerforming.type === 'reel'
      ? `/reels?id=${stats.topPerforming.id}`
      : `/post/${stats.topPerforming.id}`
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${range === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 rounded-lg border bg-white p-4">
        <p className="text-sm text-slate-600">Earnings</p>
        <p className="mt-1 text-2xl font-semibold">${dashboard.earnings.toFixed(2)}</p>
      </div>

      {monetization && (
        <div className="mb-3 rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Monetization</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${monetization.status === 'eligible' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {monetization.status === 'eligible' ? 'Eligible' : 'Locked'}
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{monetization.referrals} / {monetization.requiredReferrals} referrals</span>
              <span>{monetization.progress}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${monetization.progress}%` }} />
            </div>
          </div>
          <button
            onClick={copyReferralLink}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 active:bg-slate-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
            Copy referral link
          </button>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-sm text-slate-600">Views</p>
          <p className="mt-1 text-xl font-semibold">{stats.views.toLocaleString()}</p>
          {trendText && (
            <p className={`mt-1 text-sm font-semibold ${trend! >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{trendText}</p>
          )}
        </div>
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-sm text-slate-600">Engagement</p>
          <p className="mt-1 text-xl font-semibold">{stats.engagement.toLocaleString()}</p>
          {engTrendText && (
            <p className={`mt-1 text-sm font-semibold ${engTrend! >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{engTrendText}</p>
          )}
          {stats.engagementBreakdown && (
            <div className="mt-2 divide-y divide-slate-200 border-t border-slate-200 text-xs">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Likes</span>
                <span className="font-semibold text-slate-700">{stats.engagementBreakdown.likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Comments</span>
                <span className="font-semibold text-slate-700">{stats.engagementBreakdown.comments.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Shares</span>
                <span className="font-semibold text-slate-700">{stats.engagementBreakdown.shares.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-sm text-slate-600">New followers</p>
          <p className="mt-1 text-xl font-semibold">{stats.newFollowers.toLocaleString()}</p>
          {trendLabel(stats.followersTrendPct) && (
            <p className={trendClass(stats.followersTrendPct!)}>{trendLabel(stats.followersTrendPct)}</p>
          )}
        </div>
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-sm text-slate-600">Content</p>
          <p className="mt-1 text-xl font-semibold">{stats.content.toLocaleString()}</p>
          {trendLabel(stats.contentTrendPct) && (
            <p className={trendClass(stats.contentTrendPct!)}>{trendLabel(stats.contentTrendPct)}</p>
          )}
        </div>
      </div>

      <div className="mb-3 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">Top performing content</p>
            <p className="mt-1 text-xs text-slate-400">This month, by views</p>
          </div>
          {stats?.topPerforming && (
            <p className="text-sm font-semibold">{stats.topPerforming.views.toLocaleString()} views</p>
          )}
        </div>
        {stats?.topPerforming && topLink ? (
          <Link href={topLink} className="mt-3 flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-slate-50 active:bg-slate-100">
            {stats.topPerforming.mediaUrl ? (
              <img
                src={stats.topPerforming.mediaUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                {stats.topPerforming.type === 'reel' ? 'Reel' : 'Post'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase text-slate-400">{stats.topPerforming.type}</p>
              <p className="truncate text-sm text-slate-700">{stats.topPerforming.title}</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-400"><path d="M9 18l6-6-6-6" /></svg>
          </Link>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No content views this month yet.</p>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-sm font-medium text-slate-700">Content views</p>
          <p className="text-xs text-slate-400">Last {range} days</p>
        </div>
        <p className="mb-3 text-2xl font-semibold text-slate-900">{totalViews30d.toLocaleString()}</p>
        {dailyViews.length > 1 ? (
          <>
            <div className="relative">
              <svg
                viewBox="0 0 320 90"
                className="w-full"
                style={{ height: 90 }}
                onClick={() => setSelectedDay(null)}
                role="img"
                aria-label={`Views over the last ${range} days. Tap a point to see that day's views.`}
              >
                <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                {dailyViews.map((d, i) => {
                  const x = dailyViews.length > 1 ? (i / (dailyViews.length - 1)) * 320 : 0;
                  const y = 85 - (d.views / maxViews) * 75;
                  const selected = selectedDay === i;
                  return (
                    <circle
                      key={d.date}
                      cx={x}
                      cy={y}
                      r={selected ? 6 : 4}
                      fill={selected ? '#2563eb' : '#fff'}
                      stroke="#2563eb"
                      strokeWidth="2"
                      className="cursor-pointer"
                      style={{ touchAction: 'manipulation' }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedDay(selected ? null : i);
                      }}
                    />
                  );
                })}
              </svg>
            </div>
            <div className="mt-2 flex h-8 items-center justify-center">
              {selectedView ? (
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{selectedView.views.toLocaleString()}</span>
                  {' '}views on <span className="font-medium">{selectedView.date}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">Tap a point for daily breakdown</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-[90px] items-center justify-center text-xs text-slate-400">Not enough data yet</div>
        )}
        <div className="mt-1 flex justify-between border-t border-slate-100 pt-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
          <span>{range}d ago</span>
          <span>Today</span>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
