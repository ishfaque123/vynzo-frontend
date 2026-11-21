'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchDashboard } from '@/lib/api/userApi';
import { useAuth } from '@/lib/auth/useAuth';
import { avatarThumbUrl } from '@/components/Avatar';
import StrikesSection from '@/components/dashboard/StrikesSection';
import { fetchMe, getSavedAccounts, switchAccountRequest } from '@/lib/api/authApi';

type SwitchAccount = {
  id: string;
  username: string | null;
  displayName: string | null;
  profilePictureUrl: string | null;
  unreadNotifications?: number;
};
import Toast from '@/components/Toast';

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
    dailyEngagement?: DailyView[];
    dailyFollows?: DailyView[];
    viewsBreakdown?: { posts: number; reels: number };
    viewsTrendPct: number | null;
    topPerforming: TopPerforming | null;
    days?: number;
  };
};

const RANGES = [7, 30, 90] as const;

const DASH_TABS = [
  { key: 'analytics', label: 'Analytics' },
  { key: 'content', label: 'Content' },
  { key: 'community', label: 'Community' },
  { key: 'interactions', label: 'Interactions' },
] as const;

type DashTab = (typeof DASH_TABS)[number]['key'];


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

function MetricCard({ label, value, trend, selected, onClick }: { label: string; value: string; trend?: number | null; selected: boolean; onClick: () => void }) {
  const t = fbTrend(trend);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl p-4 text-left ${
        selected
          ? 'border-2 border-blue-600 bg-white dark:bg-[#242526]'
          : 'border-2 border-transparent bg-[#f0f2f5] dark:bg-[#333436]'
      }`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="text-[22px] font-bold">{value}</p>
        {t ? (
          <p className={`text-sm font-bold ${t.cls}`}>{t.text}</p>
        ) : (
          <p className="text-sm text-slate-400">--</p>
        )}
      </div>
    </button>
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
  const router = useRouter();
  const [tab, setTab] = useState<DashTab>('analytics');
  const [metric, setMetric] = useState<'views' | 'engagement' | 'follows' | 'earnings'>('views');
  const { user } = useAuth();

  const [switchOpen, setSwitchOpen] = useState(false);
  const [accounts, setAccounts] = useState<SwitchAccount[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [addingAccount, setAddingAccount] = useState(false);
  const popupTimerRef = useRef<number | null>(null);

  async function loadAccounts() {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const [me, list] = await Promise.all([fetchMe(), getSavedAccounts()]);
      setActiveId(me?.data?.user?.id ?? null);
      setAccounts(list?.data?.accounts ?? []);
    } catch {
      setAccountsError('Could not load accounts. Please try again.');
    } finally {
      setAccountsLoading(false);
    }
  }

  function openSwitchSheet() {
    setSwitchOpen(true);
    setSwitchError(null);
    void loadAccounts();
  }

  async function handleSelectAccount(accountId: string) {
    if (switchingId) return;
    setSwitchingId(accountId);
    setSwitchError(null);
    const result = await switchAccountRequest(accountId);
    if (result?.success) {
      setSwitchOpen(false);
      setSwitchingId(null);
      router.push('/');
      router.refresh();
    } else {
      setSwitchingId(null);
      setSwitchError('Could not switch account. Please try again.');
    }
  }

  function handleAddAccount() {
    if (addingAccount) return;
    setAddingAccount(true);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/start?switch=1`;
    let popup: Window | null = null;
    try {
      popup = window.open(url, 'frianzo-add-account', 'width=520,height=680,menubar=no,toolbar=no');
    } catch {
      popup = null;
    }
    if (!popup) {
      window.setTimeout(() => setAddingAccount(false), 8000);
      window.location.href = url;
      return;
    }
    if (popupTimerRef.current) window.clearInterval(popupTimerRef.current);
    popupTimerRef.current = window.setInterval(() => {
      if (popup && popup.closed) {
        if (popupTimerRef.current) window.clearInterval(popupTimerRef.current);
        popupTimerRef.current = null;
        setAddingAccount(false);
        void loadAccounts();
      }
    }, 600);
  }

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
  const series =
    metric === 'engagement' ? stats?.dailyEngagement || [] : metric === 'follows' ? stats?.dailyFollows || [] : dailyViews;
  const metricTitle =
    metric === 'views' ? 'Total views' : metric === 'engagement' ? 'Total engagement' : metric === 'follows' ? 'New follows' : 'Total earnings';
  const metricUnit = metric === 'engagement' ? 'engagement' : metric === 'follows' ? 'follows' : 'views';
  const maxViews = Math.max(1, ...series.map((d) => d.views));
  // Chart geometry (approved example, 2026-11-21): light gridlines with
  // value labels on the side, small points, date labels under the axis,
  // and a taller plot so the shape is easy to read.
  const CH = { w: 340, left: 30, right: 6, top: 10, plotH: 118, labelY: 158, h: 168 };
  const tickStep = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000].find((s) => s * 3 >= maxViews) || 10000;
  const yMax = tickStep * 3;
  const ticks = [0, tickStep, tickStep * 2, tickStep * 3];
  const chartX = (i: number) =>
    series.length > 1 ? CH.left + (i / (series.length - 1)) * (CH.w - CH.left - CH.right) : CH.left;
  const chartY = (v: number) => CH.top + (1 - v / yMax) * CH.plotH;
  // Smooth curve through the points (Catmull-Rom as cubic Beziers) plus a
  // matching filled area underneath — extras approved by the owner
  // (2026-11-21: filled area, smooth line, gentle draw-in animation).
  const linePath = (() => {
    if (series.length === 0) return '';
    const pts = series.map((d, i) => ({ x: chartX(i), y: chartY(d.views) }));
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
    linePath && series.length > 1
      ? `${linePath} L ${chartX(series.length - 1).toFixed(1)},${chartY(0)} L ${chartX(0).toFixed(1)},${chartY(0)} Z`
      : '';
  const labelIdx =
    series.length > 1
      ? [...new Set([0, Math.round((series.length - 1) / 4), Math.round((series.length - 1) / 2), Math.round(((series.length - 1) * 3) / 4), series.length - 1])]
      : [];
  const seriesTotal = series.reduce((sum, d) => sum + d.views, 0);
  const selectedView = selectedDay === null ? null : series[selectedDay] || null;
  const trend =
    metric === 'views'
      ? stats?.viewsTrendPct
      : metric === 'engagement'
        ? stats?.engagementTrendPct
        : metric === 'follows'
          ? stats?.followersTrendPct
          : null;
  const breakdownRows =
    metric === 'views'
      ? [
          { label: 'Post views', value: stats?.viewsBreakdown?.posts ?? 0 },
          { label: 'Reel views', value: stats?.viewsBreakdown?.reels ?? 0 },
        ]
      : metric === 'engagement' && stats?.engagementBreakdown
        ? [
            { label: 'Likes', value: stats.engagementBreakdown.likes },
            { label: 'Comments', value: stats.engagementBreakdown.comments },
            { label: 'Shares', value: stats.engagementBreakdown.shares },
          ]
        : [];
  const breakdownMax = Math.max(1, ...breakdownRows.map((r) => r.value));
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
      <div className="flex items-center gap-1 px-1 py-1">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="rounded-full p-2 text-slate-700">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <div className="ml-auto flex items-center gap-1">
          <Link href="/search" aria-label="Search" className="rounded-full p-2 text-slate-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </Link>
          {user?.username ? (
            <button type="button" onClick={openSwitchSheet} aria-label="Switch account" className="relative block">
              {user.profilePictureUrl ? (
                <img src={avatarThumbUrl(user.profilePictureUrl) || user.profilePictureUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </span>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
          ) : (
            <span className="w-9" />
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto">
        {DASH_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t.key ? 'bg-blue-600 text-white' : 'bg-[#f0f2f5] text-slate-600 dark:bg-[#333436]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <StrikesSection variant="warningOnly" />

      {tab === 'analytics' && (
        <>
      <div>
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
        <MetricCard label="Views" value={stats.views.toLocaleString()} trend={stats.viewsTrendPct} selected={metric === 'views'} onClick={() => { setMetric('views'); setSelectedDay(null); }} />
        <MetricCard label="Earnings" value={`$${dashboard.earnings.toFixed(2)}`} selected={metric === 'earnings'} onClick={() => { setMetric('earnings'); setSelectedDay(null); }} />
        <MetricCard label="Engagement" value={stats.engagement.toLocaleString()} trend={stats.engagementTrendPct} selected={metric === 'engagement'} onClick={() => { setMetric('engagement'); setSelectedDay(null); }} />
        <MetricCard label="Follows" value={stats.newFollowers.toLocaleString()} trend={stats.followersTrendPct} selected={metric === 'follows'} onClick={() => { setMetric('follows'); setSelectedDay(null); }} />
      </div>

      <div className="py-4">
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-sm font-medium text-slate-700">{metricTitle}</p>
          <p className="text-xs text-slate-400">Last {range} days</p>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-2xl font-semibold text-slate-900">{metric === 'earnings' ? `$${dashboard.earnings.toFixed(2)}` : seriesTotal.toLocaleString()}</span>
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
        {metric === 'earnings' ? (
          <div className="flex h-[168px] flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-slate-500">Your full earnings details are on the Monetization page.</p>
            <Link href="/settings-menu/monetization" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white">
              Open Monetization
            </Link>
          </div>
        ) : series.length > 1 ? (
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
                key={`${range}-${metric}`}
                viewBox={`0 0 ${CH.w} ${CH.h}`}
                className="w-full"
                style={{ height: 168 }}
                onClick={() => setSelectedDay(null)}
                role="img"
                aria-label={`${metricTitle} over the last ${range} days. Tap a point to see that day.`}
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
                {series.map((d, i) => {
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
                    key={series[i].date}
                    x={chartX(i)}
                    y={CH.labelY}
                    textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'}
                    fontSize="9"
                    fill="#94a3b8"
                  >
                    {i === series.length - 1 ? 'Today' : shortDate(series[i].date)}
                  </text>
                ))}
                {selectedView && selectedDay !== null && (() => {
                  const dateLabel = shortDate(selectedView.date);
                  const viewsLabel = `${selectedView.views.toLocaleString()} ${metricUnit}`;
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

      {breakdownRows.length > 0 && (
        <div className="py-2">
          <p className="text-lg font-bold">Breakdown</p>
          <div className="mt-3 space-y-4">
            {breakdownRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-slate-600">{row.label}</p>
                  <p className="text-sm font-semibold">{row.value.toLocaleString()}</p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(2, Math.round((row.value / breakdownMax) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <OtherTile href="/settings-menu" label="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h13M20 17h0" />
              <circle cx="16" cy="7" r="2" fill="currentColor" stroke="none" />
              <circle cx="10" cy="12" r="2" fill="currentColor" stroke="none" />
              <circle cx="18" cy="17" r="2" fill="currentColor" stroke="none" />
            </svg>
          </OtherTile>
          <OtherTile href="/tools" label="Other tools">
            <span className="grid grid-cols-2 gap-[3px]">
              <span className="h-[7px] w-[7px] rounded-[2px] bg-current" />
              <span className="h-[7px] w-[7px] rounded-[2px] bg-current" />
              <span className="h-[7px] w-[7px] rounded-[2px] bg-current" />
              <span className="h-[7px] w-[7px] rounded-[2px] bg-current" />
            </span>
          </OtherTile>
        </div>
      </div>

        </>
      )}

      {tab === 'content' && (
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
          <div className="mt-4 grid grid-cols-2 gap-3">
            <AnalyticsCard label="Content" value={stats.content.toLocaleString()} trend={stats.contentTrendPct} />
            <AnalyticsCard label="Views" value={stats.views.toLocaleString()} trend={stats.viewsTrendPct} />
          </div>
        </div>
      )}

      {tab === 'community' && (
        <div className="mt-5">
          <p className="text-lg font-bold">
            Community <span className="text-slate-400">›</span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <AnalyticsCard label="Follows" value={stats.newFollowers.toLocaleString()} trend={stats.followersTrendPct} />
            <AnalyticsCard label="Engagement" value={stats.engagement.toLocaleString()} trend={stats.engagementTrendPct} />
          </div>
        </div>
      )}

      {tab === 'interactions' && (
        <div className="mt-5">
          <p className="text-lg font-bold">
            Interactions <span className="text-slate-400">›</span>
          </p>
          {stats.engagementBreakdown ? (
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
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
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No interactions yet.</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <AnalyticsCard label="Engagement" value={stats.engagement.toLocaleString()} trend={stats.engagementTrendPct} />
            <AnalyticsCard label="Views" value={stats.views.toLocaleString()} trend={stats.viewsTrendPct} />
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {switchOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setSwitchOpen(false)}>
          <div className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-center text-sm font-semibold text-slate-800">Switch account</p>
            {accountsLoading ? (
              <div className="flex justify-center py-6" role="status" aria-label="Loading accounts"><div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" /></div>
            ) : accountsError ? (
              <div className="mb-3 rounded-lg border px-4 py-6 text-center">
                <p className="mb-3 text-sm text-red-600">{accountsError}</p>
                <button onClick={() => void loadAccounts()} className="rounded-full border px-4 py-1.5 text-sm font-medium text-slate-700">Try again</button>
              </div>
            ) : (
              <div className="mb-3 max-h-[45vh] divide-y overflow-y-auto rounded-lg border">
                {accounts.map((acc) => {
                  const isActive = acc.id === activeId;
                  return (
                    <button key={acc.id} onClick={() => !isActive && handleSelectAccount(acc.id)} disabled={isActive || switchingId !== null} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-60">
                      <span className="relative h-9 w-9 flex-shrink-0">
                        <span className="block h-full w-full overflow-hidden rounded-full bg-slate-200">
                          {acc.profilePictureUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={acc.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                        {acc.unreadNotifications != null && acc.unreadNotifications > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f02849] px-1 text-[10px] font-semibold text-white">
                            {acc.unreadNotifications > 99 ? '99+' : acc.unreadNotifications}
                          </span>
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-slate-800">{acc.displayName || acc.username || 'Frianzo user'}</span>
                      </span>
                      {isActive && <span className="text-xs font-medium text-slate-400">Active</span>}
                      {switchingId === acc.id && <span className="text-xs text-slate-400">Switching...</span>}
                    </button>
                  );
                })}
                {accounts.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">No saved accounts yet.</p>}
              </div>
            )}
            {switchError && <p className="mb-2 text-center text-sm text-red-600">{switchError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setSwitchOpen(false)} className="flex-1 rounded-full border py-2.5 text-sm font-medium text-slate-700">Cancel</button>
              <button onClick={handleAddAccount} disabled={addingAccount || accounts.length >= 5} className="flex-1 rounded-full bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-60">{accounts.length >= 5 ? 'Maximum 5 accounts' : addingAccount ? 'Waiting for login...' : '+ Add account'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
