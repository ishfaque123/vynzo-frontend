'use client';

import { useEffect, useState } from 'react';

type Strike = {
  id: string;
  severity: string;
  reason: string;
  action: string;
  createdAt: string;
};

type Removal = {
  id: string;
  type: string;
  detail: string | null;
  createdAt: string;
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

export default function StrikesSection() {
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [removals, setRemovals] = useState<Removal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Cache-first: show the last known standing instantly on reload, then
    // refresh it silently.
    try {
      const raw = localStorage.getItem('frianzo:strikesCache');
      if (raw) {
        const cached = JSON.parse(raw);
        setStrikes(cached.strikes || []);
        setRemovals(cached.removals || []);
        setLoading(false);
      }
    } catch {
      // Best-effort only.
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/strikes`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) {
          setStrikes(d.data.strikes || []);
          setRemovals(d.data.removals || []);
          try {
            localStorage.setItem('frianzo:strikesCache', JSON.stringify({ strikes: d.data.strikes || [], removals: d.data.removals || [] }));
          } catch {
            // Best-effort only.
          }
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="mb-3 h-[86px] animate-pulse rounded-2xl bg-slate-100" />;
  }

  const total = strikes.length + removals.length;

  // Good standing banner (Facebook Business Dashboard style)
  if (total === 0) {
    return (
      <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[#f0f2f5] p-4 dark:bg-[#333436]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </span>
        <div>
          <p className="text-[15px] font-medium">Your account is in good standing.</p>
          <p className="text-sm text-slate-500">No strikes or warnings on your account.</p>
        </div>
      </div>
    );
  }

  // Has violations: risk banner + the detail list underneath
  return (
    <div className="mb-3">
      <div className="flex items-center gap-3 rounded-2xl bg-[#f0f2f5] p-4 dark:bg-[#333436]">
        <svg width="34" height="34" viewBox="0 0 24 24" className="shrink-0">
          <path d="M12 3L22 20H2z" fill="#f5c518" />
          <rect x="11.1" y="9" width="1.8" height="6" rx="0.9" fill="#1c1e21" />
          <circle cx="12" cy="17.4" r="1.1" fill="#1c1e21" />
        </svg>
        <p className="text-[15px] font-medium">
          Your profile is at risk of being suspended because it repeatedly didn&apos;t follow the rules.
        </p>
      </div>
      <div className="mt-2 space-y-1 px-1">
        {strikes.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-medium text-slate-700">{s.reason}</p>
              <p className="text-[11px] text-slate-400">{timeAgo(s.createdAt)}</p>
            </div>
            <span className="text-[11px] font-medium capitalize text-slate-500">{s.severity}</span>
          </div>
        ))}
        {removals.map((r) => (
          <div key={r.id} className="py-2">
            <p className="text-xs font-medium text-slate-700">
              {r.type === 'comment_removed' ? 'Comment removed' : r.type === 'post_removed' ? 'Post removed' : 'Reel removed'}
            </p>
            <p className="text-[11px] text-slate-400">{timeAgo(r.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
