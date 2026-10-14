'use client';

import { useEffect, useState } from 'react';
import { AchievementIcon } from '@/components/AchievementIcons';

type Achievement = {
  key: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
};

export default function AchievementsSection() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/achievements`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.success) setAchievements(d.data.achievements || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="mb-3 h-24 animate-pulse rounded-lg bg-slate-100" />;
  }
  if (achievements.length === 0) return null;

  return (
    <div className="mb-3 rounded-lg border bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800">Achievements</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {achievements.map((a) => (
          <div key={a.key} className="flex w-20 shrink-0 flex-col items-center gap-1.5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900">
              <span className="text-white"><AchievementIcon icon={a.icon} size={26} /></span>
            </div>
            <span className="text-center text-[11px] font-medium leading-tight text-slate-700">{a.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
