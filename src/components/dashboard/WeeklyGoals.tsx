'use client';

type Goal = { current: number; target: number };

function Ring({ current, target, label, icon }: { current: number; target: number; label: string; icon: string }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const r = 34;
  const c = 2 * Math.PI * r;
  const done = current >= target;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
          <circle
            cx="40" cy="40" r={r} fill="none"
            stroke={done ? '#10b981' : '#3b82f6'}
            strokeWidth="7" strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * pct) / 100}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base leading-none">{icon}</span>
          <span className="mt-0.5 text-xs font-bold text-slate-800">{current}/{target}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}

export default function WeeklyGoals({ goals, allGoalsMet, newAchievement }: {
  goals?: { posts: Goal; reels: Goal; stories: Goal };
  allGoalsMet?: boolean;
  newAchievement?: { key: string; name: string } | null;
}) {
  if (!goals) return null;

  return (
    <div className="mb-3 rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Weekly goals</p>
        {allGoalsMet && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            🏆 Complete!
          </span>
        )}
      </div>
      {newAchievement && (
        <div className="mb-3 rounded-lg bg-amber-50 p-3 text-center">
          <p className="text-sm font-semibold text-amber-800">🎉 New achievement: {newAchievement.name}!</p>
        </div>
      )}
      <div className="flex justify-around">
        <Ring current={goals.posts.current} target={goals.posts.target} label="Posts" icon="📝" />
        <Ring current={goals.reels.current} target={goals.reels.target} label="Reels" icon="🎬" />
        <Ring current={goals.stories.current} target={goals.stories.target} label="Stories" icon="📖" />
      </div>
      {allGoalsMet && (
        <p className="mt-3 text-center text-xs text-slate-400">Fresh goals start Monday</p>
      )}
    </div>
  );
}
