'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard } from '@/lib/api/userApi';

function StatCard({ label }: { label: string }) {
  return (
    <div className="rounded-lg bg-slate-100 p-4 opacity-60">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-semibold">--</p>
      <p className="mt-1.5 text-xs text-slate-400">Coming soon</p>
    </div>
  );
}

type DashboardData = {
  earnings: number;
  monetization?: {
    status: 'locked' | 'eligible';
    friends: number;
    requiredFriends: number;
    progress: number;
  };
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboard().then((result) => {
      if (result.success) setDashboard(result.data);
    });
  }, []);

  const monetization = dashboard?.monetization;
  const requiredFriends = monetization?.requiredFriends ?? 25;
  const friends = monetization?.friends ?? 0;
  const progress = monetization?.progress ?? 0;
  const eligible = monetization?.status === 'eligible';

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Dashboard</h1>

      <div className="mb-3 rounded-lg border bg-white p-4">
        <p className="text-sm text-slate-600">Earnings</p>
        <p className="mt-1 text-2xl font-semibold">
          {dashboard === null ? '...' : '$' + dashboard.earnings.toFixed(2)}
        </p>
      </div>

      <div className="mb-3 rounded-lg border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Monetization</p>
            <p className="mt-1 text-xs text-slate-500">
              {eligible
                ? 'You have completed the 25-friend requirement.'
                : 'Complete ' + requiredFriends + ' friends to become eligible.'}
            </p>
          </div>
          <span
            className={
              eligible
                ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700'
                : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'
            }
          >
            {eligible ? 'Eligible' : 'Locked'}
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>{friends} / {requiredFriends} friends</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: progress + '%' }}
            />
          </div>
        </div>

        {eligible && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Monetization eligibility unlocked. Application flow will be added next.
          </p>
        )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <StatCard label="Views" />
        <StatCard label="Engagement" />
        <StatCard label="Net followers" />
        <StatCard label="Content" />
      </div>

      <div className="rounded-lg bg-slate-100 p-4 opacity-60">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-slate-600">Analytics, last 30 days</p>
          <p className="text-xs text-slate-400">Coming soon</p>
        </div>
        <div className="mb-2 flex gap-4 text-xs text-slate-500">
          <span>Views --</span>
          <span>Engagement --</span>
          <span>Watch time --</span>
        </div>
        <svg viewBox="0 0 320 90" className="w-full" style={{ height: 90 }}>
          <polyline points="0,70 40,65 80,60 120,62 160,50 200,55 240,40 280,45 320,30" fill="none" stroke="#94a3b8" strokeWidth="2" />
        </svg>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>30 days ago</span>
          <span>15 days ago</span>
          <span>today</span>
        </div>
      </div>
    </div>
  );
}
