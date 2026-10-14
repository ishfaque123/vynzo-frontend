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
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Achievements</p>
        <span className="text-xs font-medium text-slate-400">{achievements.length} earned</span>
      </div>
      <div className="space-y-2">
        {achievements.map((a) => (
          <div key={a.key} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900">
              <span className="text-white"><AchievementIcon icon={a.icon} size={20} /></span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{a.name}</p>
              <p className="truncate text-xs text-slate-500">{a.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
