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
type DashboardData = {
  earnings: number;
  stats: {
    views: number;
    engagement: number;
    newFollowers: number;
    content: number;
    dailyViews: DailyView[];
  };
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

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
        <StatCard label="Views" value={stats ? stats.views : '...'} />
        <StatCard label="Engagement" value={stats ? stats.engagement : '...'} />
        <StatCard label="New followers" value={stats ? stats.newFollowers : '...'} />
        <StatCard label="Content" value={stats ? stats.content : '...'} />
      </div>

      <div className="rounded-lg bg-slate-100 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-slate-600">Views, last 30 days</p>
          <p className="text-xs text-slate-400">{totalViews30d.toLocaleString()} total views</p>
        </div>
        {dailyViews.length > 1 ? (
          <svg viewBox="0 0 320 90" className="w-full" style={{ height: 90 }}>
            <polyline points={points} fill="none" stroke="#0f172a" strokeWidth="2" />
          </svg>
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
