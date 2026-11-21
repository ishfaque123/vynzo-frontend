'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { fetchDashboard } from '@/lib/api/userApi';
import Toast from '@/components/Toast';
import AchievementsSection from '@/components/dashboard/AchievementsSection';
import StrikesSection from '@/components/dashboard/StrikesSection';
import WeeklyGoals from '@/components/dashboard/WeeklyGoals';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="py-2">
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

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
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


function fbTrend(v: number | null | undefined) {
  if (v === null || v === undefined) return null;
  return {
    text: v >= 0 ? `↑ ${v}%` : `↓ ${v}%`,
    cls: v >= 0 ? 'text-emerald-500' : 'text-red-500',
  };
}

function AnalyticsCard({ label, value, trend }: { label: string; value: string; trend?: number | null }) {
  const t = fbTrend(trend);
  return (
    <div className="rounded-2xl bg-[#f0f2f5] p-4 dark:bg-[#333436]">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="text-[22px] font-bold">{value}</p>
        {t ? (
          <p className={`text-sm font-bold ${t.cls}`}>{t.text}</p>
        ) : (
          <p className="text-sm text-slate-400">--</p>
        )}
      </div>
    </div>
  );
}

function OtherTile({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-2xl bg-[#f0f2f5] p-4 dark:bg-[#333436]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-500 text-slate-600">
        {children}
      </div>
      <p className="mt-3 text-[15px] font-semibold">{label}</p>
    </Link>
  );
}

const DASHBOARD_CACHE_PREFIX = 'frianzo:dashboardCache:';

function readDashboardCache(days: number): DashboardData | null {
  try {
    const raw = localStorage.getItem(`${DASHBOARD_CACHE_PREFIX}${days}`);
    return raw ? (JSON.parse(raw) as DashboardData) : null;
  } catch {
    return null;
  }
}

function writeDashboardCache(days: number, data: DashboardData) {
  try {
    localStorage.setItem(`${DASHBOARD_CACHE_PREFIX}${days}`, JSON.stringify(data));
  } catch {
    // Best-effort only.
  }
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [range, setRange] = useState<number>(30);

  const hasDataRef = useRef(false);

  function load(days: number) {
    // Silent refresh: the full-page loading screen is only for the very
    // first load. After that the current numbers stay on screen and are
    // replaced in place when the new range arrives (Facebook style).
    setError(false);
    setSelectedDay(null);
    if (!hasDataRef.current) {
      // Cache-first: paint the last numbers instantly on reload, then
      // refresh them silently in the background.
      const cached = readDashboardCache(days);
      if (cached) {
        hasDataRef.current = true;
        setDashboard(cached);
        setLoading(false);
      }
    }
    fetchDashboard(days)
      .then((result) => {
        if (result.success) {
          hasDataRef.current = true;
          setDashboard(result.data);
          writeDashboardCache(days, result.data);
        } else if (!hasDataRef.current) {
          setError(true);
        } else {
          setToast({ message: 'Could not refresh the dashboard. Please try again.', type: 'error' });
        }
      })
      .catch(() => {
        if (!hasDataRef.current) setError(true);
        else setToast({ message: 'Could not refresh the dashboard. Please try again.', type: 'error' });
      })
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
  // Chart geometry (approved example, 2026-11-21): light gridlines with
  // value labels on the side, small points, date labels under the axis,
  // and a taller plot so the shape is easy to read.
  const CH = { w: 340, left: 30, right: 6, top: 10, plotH: 118, labelY: 158, h: 168 };
  const tickStep = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000].find((s) => s * 3 >= maxViews) || 10000;
  const yMax = tickStep * 3;
  const ticks = [0, tickStep, tickStep * 2, tickStep * 3];
  const chartX = (i: number) =>
    dailyViews.length > 1 ? CH.left + (i / (dailyViews.length - 1)) * (CH.w - CH.left - CH.right) : CH.left;
  const chartY = (v: number) => CH.top + (1 - v / yMax) * CH.plotH;
  // Smooth curve through the points (Catmull-Rom as cubic Beziers) plus a
  // matching filled area underneath — extras approved by the owner
  // (2026-11-21: filled area, smooth line, gentle draw-in animation).
  const linePath = (() => {
    if (dailyViews.length === 0) return '';
    const pts = dailyViews.map((d, i) => ({ x: chartX(i), y: chartY(d.views) }));
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    let path = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return path;
  })();
  const areaPath =
    linePath && dailyViews.length > 1
      ? `${linePath} L ${chartX(dailyViews.length - 1).toFixed(1)},${chartY(0)} L ${chartX(0).toFixed(1)},${chartY(0)} Z`
      : '';
  const labelIdx =
    dailyViews.length > 1
      ? [...new Set([0, Math.round((dailyViews.length - 1) / 4), Math.round((dailyViews.length - 1) / 2), Math.round(((dailyViews.length - 1) * 3) / 4), dailyViews.length - 1])]
      : [];
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
      </div>

      <div id="account-status" className="scroll-mt-4">
        <StrikesSection />
      </div>

      <div className="mt-5">
        <p className="text-lg font-bold">
          Analytics <span className="text-slate-400">›</span>
        </p>
        <div className="mt-3 flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                range === r
                  ? 'rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white'
                  : 'rounded-full px-4 py-1.5 text-sm text-slate-500'
              }
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <AnalyticsCard label="Views" value={stats.views.toLocaleString()} trend={stats.viewsTrendPct} />
        <AnalyticsCard label="Earnings" value={`$${dashboard.earnings.toFixed(2)}`} />
        <AnalyticsCard label="Engagement" value={stats.engagement.toLocaleString()} trend={stats.engagementTrendPct} />
        <AnalyticsCard label="Follows" value={stats.newFollowers.toLocaleString()} trend={stats.followersTrendPct} />
      </div>

      {stats.engagementBreakdown && (
        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-base font-semibold">{stats.engagementBreakdown.likes.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Likes</p>
          </div>
          <div>
            <p className="text-base font-semibold">{stats.engagementBreakdown.comments.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Comments</p>
          </div>
          <div>
            <p className="text-base font-semibold">{stats.engagementBreakdown.shares.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Shares</p>
          </div>
          <div>
            <p className="text-base font-semibold">{stats.content.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Content</p>
          </div>
        </div>
      )}

      <div className="py-4">
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-sm font-medium text-slate-700">Content views</p>
          <p className="text-xs text-slate-400">Last {range} days</p>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-2xl font-semibold text-slate-900">{totalViews30d.toLocaleString()}</span>
          {typeof trend === 'number' && (
            <>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  trend >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
                }`}
              >
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
              </span>
              <span className="text-[11px] text-slate-400">vs previous {range} days</span>
            </>
          )}
        </div>
        {dailyViews.length > 1 ? (
          <>
            <div className="relative">
              <style>{`
                @keyframes chartDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
                @keyframes chartFade { from { opacity: 0; } to { opacity: 1; } }
                .chart-line { stroke-dasharray: 1; stroke-dashoffset: 1; animation: chartDraw 0.9s ease-out 0.1s forwards; }
                .chart-area { opacity: 0; animation: chartFade 0.7s ease-out 0.45s forwards; }
                .chart-tip { animation: chartFade 0.15s ease-out; }
              `}</style>
              <svg
                key={range}
                viewBox={`0 0 ${CH.w} ${CH.h}`}
                className="w-full"
                style={{ height: 168 }}
                onClick={() => setSelectedDay(null)}
                role="img"
                aria-label={`Views over the last ${range} days. Tap a point to see that day's views.`}
              >
                {ticks.map((t) => (
                  <g key={t}>
                    <line x1={CH.left} x2={CH.w - CH.right} y1={chartY(t)} y2={chartY(t)} stroke="#e2e8f0" strokeWidth="1" />
                    <text x={CH.left - 5} y={chartY(t) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                      {t.toLocaleString()}
                    </text>
                  </g>
                ))}
                {areaPath && <path d={areaPath} fill="#2563eb" fillOpacity="0.1" stroke="none" className="chart-area" />}
                {linePath && (
                  <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chart-line" pathLength={1} />
                )}
                {selectedDay !== null && selectedView && (
                  <line
                    x1={chartX(selectedDay)}
                    x2={chartX(selectedDay)}
                    y1={chartY(selectedView.views)}
                    y2={CH.top + CH.plotH}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />
                )}
                {dailyViews.map((d, i) => {
                  const x = chartX(i);
                  const y = chartY(d.views);
                  const selected = selectedDay === i;
                  return (
                    <g key={d.date}>
                      {selected && <circle cx={x} cy={y} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth="2" className="chart-tip" />}
                      <circle
                        cx={x}
                        cy={y}
                        r={11}
                        fill="transparent"
                        className="cursor-pointer"
                        style={{ touchAction: 'manipulation' }}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedDay(selected ? null : i);
                        }}
                      />
                    </g>
                  );
                })}
                {labelIdx.map((i) => (
                  <text
                    key={dailyViews[i].date}
                    x={chartX(i)}
                    y={CH.labelY}
                    textAnchor={i === 0 ? 'start' : i === dailyViews.length - 1 ? 'end' : 'middle'}
                    fontSize="9"
                    fill="#94a3b8"
                  >
                    {i === dailyViews.length - 1 ? 'Today' : shortDate(dailyViews[i].date)}
                  </text>
                ))}
                {selectedView && selectedDay !== null && (() => {
                  const dateLabel = shortDate(selectedView.date);
                  const viewsLabel = `${selectedView.views.toLocaleString()} views`;
                  const w = Math.max(64, viewsLabel.length * 6.2 + 20);
                  const cx = Math.min(Math.max(chartX(selectedDay), CH.left + w / 2), CH.w - CH.right - w / 2);
                  const above = chartY(selectedView.views) > 56;
                  const ty = above ? chartY(selectedView.views) - 46 : chartY(selectedView.views) + 14;
                  return (
                    <g pointerEvents="none" className="chart-tip">
                      <rect x={cx - w / 2} y={ty} width={w} height={34} rx={9} fill="#ffffff" stroke="#cbd5e1" />
                      <text x={cx} y={ty + 13} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#64748b">
                        {dateLabel}
                      </text>
                      <text x={cx} y={ty + 27} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#0f172a">
                        {viewsLabel}
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </>
        ) : (
          <div className="flex h-[168px] items-center justify-center text-xs text-slate-400">Not enough data yet</div>
        )}
      </div>

      {monetization && monetization.status === 'eligible' && (
        <div className="mb-3 py-4">
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

      <div className="mt-5">
        <p className="text-lg font-bold">
          Content <span className="text-slate-400">›</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">Top performing</p>
        {stats?.topPerforming && topLink ? (
          <Link href={topLink} className="mt-3 flex items-center gap-3 rounded-2xl bg-[#f0f2f5] p-3 dark:bg-[#333436]">
            {stats.topPerforming.mediaUrl ? (
              <img
                src={stats.topPerforming.mediaUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs text-slate-400">
                {stats.topPerforming.type === 'reel' ? 'Reel' : 'Post'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase text-slate-400">{stats.topPerforming.type}</p>
              <p className="truncate text-sm font-medium">{stats.topPerforming.title}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-black/5 px-2 py-1 text-xs font-semibold dark:bg-white/10">
              {stats.topPerforming.views.toLocaleString()} views
            </span>
          </Link>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No content views this month yet.</p>
        )}
      </div>

      <div className="mt-5">
        <div id="weekly-goals" className="scroll-mt-4">
          <WeeklyGoals goals={(dashboard as any).goals} allGoalsMet={(dashboard as any).allGoalsMet} newAchievement={(dashboard as any).newAchievement} />
        </div>
        <div id="achievements" className="scroll-mt-4">
          <AchievementsSection />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-lg font-bold">Other</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <OtherTile href="/boost/my" label="Ads Manager">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none" />
            </svg>
          </OtherTile>
          <OtherTile href="/settings-menu/monetization" label="Monetization">
            <span className="text-lg font-bold">$</span>
          </OtherTile>
          <OtherTile href="/settings-menu/monetization#referrals" label="Referrals">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c.6-3.2 3.2-5 6.5-5s5.9 1.8 6.5 5" />
              <path d="M16 5.2a3.5 3.5 0 010 6.3M18.6 15.3c1.6.9 2.6 2.4 2.9 4.7" />
            </svg>
          </OtherTile>
          <OtherTile href="#account-status" label="Account Status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l7 2.8v5.4c0 4.4-2.9 8.1-7 9.8-4.1-1.7-7-5.4-7-9.8V5.8z" />
              <path d="M9 11.8l2.2 2.2 4-4.2" />
            </svg>
          </OtherTile>
          <OtherTile href="#achievements" label="Achievements">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 21h8M12 17.5V21M7 4h10v4.5a5 5 0 01-10 0z" />
              <path d="M7 5.5H4.2A2.7 2.7 0 007 10M17 5.5h2.8A2.7 2.7 0 0117 10" />
            </svg>
          </OtherTile>
          <OtherTile href="#weekly-goals" label="Weekly Goals">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </OtherTile>
          <OtherTile href="/settings-menu" label="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h13M20 17h0" />
              <circle cx="16" cy="7" r="2" fill="currentColor" stroke="none" />
              <circle cx="10" cy="12" r="2" fill="currentColor" stroke="none" />
              <circle cx="18" cy="17" r="2" fill="currentColor" stroke="none" />
            </svg>
          </OtherTile>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
