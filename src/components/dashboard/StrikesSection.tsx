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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/strikes`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) {
          setStrikes(d.data.strikes || []);
          setRemovals(d.data.removals || []);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="mb-3 h-16 animate-pulse rounded-lg bg-slate-100" />;
  }

  const total = strikes.length + removals.length;

  // Good standing: minimal clean display
  if (total === 0) {
    return (
      <div className="mb-3 flex items-center justify-between rounded-lg border bg-white px-4 py-3">
        <p className="text-sm font-medium text-slate-700">Account health</p>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Good</span>
      </div>
    );
  }

  // Has violations: show warning + list
  return (
    <div className="mb-3 rounded-lg border border-amber-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Account health</p>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Warning</span>
      </div>
      {total >= 3 && (
        <p className="mb-3 text-xs text-amber-700">
          Your profile is at risk of being suspended because it repeatedly didn't follow the rules.
        </p>
      )}
      <div className="space-y-2">
        {strikes.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <div>
              <p className="text-xs font-medium text-slate-700">{s.reason}</p>
              <p className="text-[11px] text-slate-400">{timeAgo(s.createdAt)}</p>
            </div>
            <span className="text-[11px] font-medium capitalize text-slate-500">{s.severity}</span>
          </div>
        ))}
        {removals.map((r) => (
          <div key={r.id} className="rounded-lg bg-slate-50 px-3 py-2">
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
