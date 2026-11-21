'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDashboard } from '@/lib/api/userApi';
import WeeklyGoals from '@/components/dashboard/WeeklyGoals';
import Skeleton from '@/components/Skeleton';

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export default function WeeklyGoalsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchDashboard(30)
      .then((r) => {
        if (r.success) setData(r.data);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="flex items-center gap-1 px-1 py-1">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="rounded-full p-2 text-slate-700">
          <BackIcon />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Weekly Goals</h1>
      </div>

      <div className="mt-3">
        {data ? (
          <WeeklyGoals goals={data.goals} allGoalsMet={data.allGoalsMet} newAchievement={data.newAchievement} />
        ) : failed ? (
          <p className="py-4 text-center text-xs text-slate-500">Could not load your weekly goals. Please try again.</p>
        ) : (
          <Skeleton className="h-40 w-full rounded-lg" />
        )}
      </div>
    </div>
  );
}
