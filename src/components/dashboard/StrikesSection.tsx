'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

const SEVERITY_COLOR: Record<string, string> = {
  low: 'bg-yellow-100 text-yellow-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-800',
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
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
    return <div className="mb-3 h-32 animate-pulse rounded-lg bg-slate-100" />;
  }

  const total = strikes.length + removals.length;
  const atRisk = total >= 3;

  return (
    <div className="mb-3 overflow-hidden rounded-lg border bg-white">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Account Health</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${total === 0 ? 'bg-emerald-100 text-emerald-700' : atRisk ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {total === 0 ? 'Good standing' : `${total} strike${total > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {atRisk && (
        <div className="mx-4 mb-3 flex gap-3 rounded-lg bg-amber-50 p-3">
          <span className="text-xl">⚠️</span>
          <p className="text-xs text-amber-800">
            Your profile is at risk of being suspended because it repeatedly didn't follow the rules.
          </p>
        </div>
      )}

      {total === 0 ? (
        <p className="px-4 pb-4 text-sm text-slate-400">
          No violations. Keep following the community guidelines!
        </p>
      ) : (
        <div className="space-y-2 px-4 pb-4">
          {strikes.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <div>
                <p className="text-xs font-medium text-slate-700">{s.reason}</p>
                <p className="text-[11px] text-slate-400">{timeAgo(s.createdAt)} · {s.action.replace(/_/g, ' ')}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${SEVERITY_COLOR[s.severity] || 'bg-slate-100 text-slate-600'}`}>
                {s.severity}
              </span>
            </div>
          ))}
          {removals.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <div>
                <p className="text-xs font-medium text-slate-700">
                  {r.type === 'comment_removed' ? 'Comment removed' : r.type === 'post_removed' ? 'Post removed' : 'Reel removed'}
                </p>
                <p className="text-[11px] text-slate-400">{timeAgo(r.createdAt)}{r.detail ? ` · ${r.detail.slice(0, 60)}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t px-4 py-3">
        <Link href="/community-guidelines" className="text-xs font-medium text-blue-600">
          Review Community Guidelines →
        </Link>
      </div>
    </div>
  );
}
