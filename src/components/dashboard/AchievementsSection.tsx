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
    return <div className="mb-3 h-32 animate-pulse rounded-lg bg-slate-100" />;
  }

  return (
    <div className="mb-3 rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Achievements</p>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          {achievements.length} unlocked
        </span>
      </div>

      {achievements.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No achievements yet. Keep posting to unlock badges!
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((a) => (
            <div
              key={a.key}
              title={`${a.name} — ${a.description}`}
              className="flex flex-col items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2 py-3"
            >
              <span className="text-amber-600"><AchievementIcon icon={a.icon} size={28} /></span>
              <span className="text-center text-[11px] font-semibold text-amber-800">{a.name}</span>
              <span className="line-clamp-2 text-center text-[10px] text-amber-600">{a.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
