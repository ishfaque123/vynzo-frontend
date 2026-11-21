'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchLeaderboard } from '@/lib/api/userApi';
import VerifiedBadge from '@/components/VerifiedBadge';
import Skeleton from '@/components/Skeleton';

type LeaderboardEntry = {
  rank: number;
  username: string;
  displayName: string | null;
  avatar: string | null;
  isVerified: boolean;
  count: number;
};

type LeaderboardTab = 'followers' | 'likers' | 'commenters';

const LEADERBOARD_TABS: { key: LeaderboardTab; label: string; unit: string }[] = [
  { key: 'followers', label: 'Followers', unit: 'followers' },
  { key: 'likers', label: 'Likers', unit: 'likes' },
  { key: 'commenters', label: 'Commenters', unit: 'comments' },
];

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4a1 1 0 0 0-1 1c0 2.5 2 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.5-2 4-4 4" />
    </svg>
  );
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('followers');
  const [boards, setBoards] = useState<Partial<Record<LeaderboardTab, LeaderboardEntry[]>>>({});
  const [boardLoading, setBoardLoading] = useState(false);

  function loadBoard(tab: LeaderboardTab) {
    if (boards[tab]) return;
    setBoardLoading(true);
    fetchLeaderboard(tab, 10)
      .then((r) => {
        if (r.success) setBoards((prev) => ({ ...prev, [tab]: r.data?.leaderboard ?? [] }));
      })
      .catch(() => {})
      .finally(() => setBoardLoading(false));
  }

  useEffect(() => { loadBoard(activeTab); }, [activeTab]);

  const entries = boards[activeTab] ?? [];
  const unit = LEADERBOARD_TABS.find((t) => t.key === activeTab)?.unit;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="flex items-center gap-1 px-1 py-1">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="rounded-full p-2 text-slate-700">
          <BackIcon />
        </button>
        <span className="text-amber-500"><TrophyIcon /></span>
        <h1 className="text-lg font-semibold text-slate-900">Leaderboard</h1>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto">
        {LEADERBOARD_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
              activeTab === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {boardLoading && !boards[activeTab] ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">No rankings yet — be the first!</p>
        ) : (
          <div className="space-y-1">
            {entries.map((e) => (
              <a
                key={e.username}
                href={`/u/${e.username}`}
                className={`flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 ${
                  e.rank === 1 ? 'bg-amber-50' : e.rank === 2 ? 'bg-slate-100' : e.rank === 3 ? 'bg-orange-50' : ''
                }`}
              >
                {e.rank <= 3 ? (
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      e.rank === 1 ? 'bg-amber-500' : e.rank === 2 ? 'bg-slate-400' : 'bg-amber-700'
                    }`}
                  >
                    {e.rank}
                  </span>
                ) : (
                  <span className="w-6 shrink-0 text-center text-sm font-bold text-slate-400">{e.rank}</span>
                )}
                {e.avatar ? (
                  <img src={e.avatar} alt={e.displayName || e.username} loading="lazy" className="h-10 w-10 shrink-0 rounded-full bg-slate-200 object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">
                    {(e.displayName || e.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-slate-900">{e.displayName || e.username}</p>
                  {e.isVerified && <VerifiedBadge size="sm" />}
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-xs font-bold text-slate-800">{e.count.toLocaleString()}</span>
                  <span className="block text-[10px] text-slate-500">{unit}</span>
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
