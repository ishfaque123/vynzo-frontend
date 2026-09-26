'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard } from '@/lib/api/userApi';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-slate-100 p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
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
type DashboardData = {
  earnings: number;
  stats: {
    views: number;
    engagement: number;
    newFollowers: number;
    content: number;
    dailyViews: DailyView[];
    viewsTrendPct: number | null;
    topPerforming: TopPerforming | null;
  };
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboard().then((result) => {
      if (result.success) setDashboard(result.data);
    });
  }, []);

  const stats = dashboard?.stats;
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
      ? 'No previous data'
      : `${trend > 0 ? '+' : ''}${trend}% vs previous 30 days`;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Dashboard</h1>

      <div className="mb-3 rounded-lg border bg-white p-4">
        <p className="text-sm text-slate-600">Earnings</p>
        <p className="mt-1 text-2xl font-semibold">
          {dashboard === null ? '...' : '$' + dashboard.earnings.toFixed(2)}
        </p>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-100 p-4">
          <p className="text-sm text-slate-600">Views</p>
          <p className="mt-1 text-xl font-semibold">{stats ? stats.views.toLocaleString() : '...'}</p>
          {stats && <p className="mt-1 text-xs text-slate-500">{trendText}</p>}
        </div>
        <StatCard label="Engagement" value={stats ? stats.engagement : '...'} />
        <StatCard label="New followers" value={stats ? stats.newFollowers : '...'} />
        <StatCard label="Content" value={stats ? stats.content : '...'} />
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
        {stats?.topPerforming ? (
          <div className="mt-3 flex items-center gap-3">
            {stats.topPerforming.mediaUrl ? (
              <img
                src={stats.topPerforming.mediaUrl}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                {stats.topPerforming.type === 'reel' ? 'Reel' : 'Post'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-slate-400">{stats.topPerforming.type}</p>
              <p className="truncate text-sm text-slate-700">{stats.topPerforming.title}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No content views this month yet.</p>
        )}
      </div>

      <div className="rounded-lg bg-slate-100 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-slate-600">Views, last 30 days</p>
          <p className="text-xs text-slate-400">{totalViews30d.toLocaleString()} total views</p>
        </div>
        {dailyViews.length > 1 ? (
          <>
            <div className="relative">
              <svg
                viewBox="0 0 320 90"
                className="w-full"
                style={{ height: 90 }}
                onClick={() => setSelectedDay(null)}
                role="img"
                aria-label="Views over the last 30 days"
              >
                <polyline points={points} fill="none" stroke="#0f172a" strokeWidth="2" />
                {dailyViews.map((d, i) => {
                  const x = dailyViews.length > 1 ? (i / (dailyViews.length - 1)) * 320 : 0;
                  const y = 85 - (d.views / maxViews) * 75;
                  const selected = selectedDay === i;
                  return (
                    <circle
                      key={d.date}
                      cx={x}
                      cy={y}
                      r={selected ? 5 : 3.5}
                      fill="#0f172a"
                      className="cursor-pointer"
                      onMouseEnter={() => setSelectedDay(i)}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedDay(i);
                      }}
                    />
                  );
                })}
              </svg>
            </div>
            {selectedView && (
              <div className="mt-2 rounded-md border bg-white px-3 py-2 text-xs text-slate-600">
                <span className="font-medium">{selectedView.date}</span>
                <span className="mx-1">·</span>
                <span>{selectedView.views.toLocaleString()} views</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-[90px] items-center justify-center text-xs text-slate-400">Not enough data yet</div>
        )}
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>30 days ago</span>
          <span>15 days ago</span>
          <span>today</span>
        </div>
      </div>
    </div>
  );
}
