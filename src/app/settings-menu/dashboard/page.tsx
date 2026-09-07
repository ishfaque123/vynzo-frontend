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

export default function DashboardPage() {
  const [earnings, setEarnings] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboard().then((result) => {
      if (result.success) setEarnings(result.data.earnings);
    });
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Dashboard</h1>

      <div className="mb-3 rounded-lg border bg-white p-4">
        <p className="text-sm text-slate-600">Earnings</p>
        <p className="mt-1 text-2xl font-semibold">
          {earnings === null ? '...' : `$${earnings.toFixed(2)}`}
        </p>
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
