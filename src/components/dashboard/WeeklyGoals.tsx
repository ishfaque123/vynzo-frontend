'use client';

type Goal = { current: number; target: number };

function PostIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function ReelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.5" />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
    </svg>
  );
}

function StoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function Ring({ current, target, label, icon }: { current: number; target: number; label: string; icon: React.ReactNode }) {
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
          {icon}
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
            Complete
          </span>
        )}
      </div>
      {newAchievement && (
        <div className="mb-3 rounded-lg bg-amber-50 p-3 text-center">
          <p className="text-sm font-semibold text-amber-800">New achievement: {newAchievement.name}</p>
        </div>
      )}
      <div className="flex justify-around">
        <Ring current={goals.posts.current} target={goals.posts.target} label="Posts" icon={<PostIcon />} />
        <Ring current={goals.reels.current} target={goals.reels.target} label="Reels" icon={<ReelIcon />} />
        <Ring current={goals.stories.current} target={goals.stories.target} label="Stories" icon={<StoryIcon />} />
      </div>
      {allGoalsMet && (
        <p className="mt-3 text-center text-xs text-slate-400">Fresh goals start Monday</p>
      )}
    </div>
  );
}
