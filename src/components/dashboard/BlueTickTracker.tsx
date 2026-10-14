'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Requirement = {
  current: number | string;
  required: number | string;
  met: boolean;
};

type Eligibility = {
  eligible: boolean;
  requirements: Record<string, Requirement>;
  isVerified: boolean;
};

const LABELS: Record<string, string> = {
  referrals: 'Referrals',
  followers: 'Followers',
  accountAge: 'Account age',
  posts: 'Posts',
  profile: 'Profile',
  cleanRecord: 'Clean record',
};

const TIPS: Record<string, string> = {
  referrals: 'Share your referral link to invite friends',
  followers: 'Post engaging content to grow followers',
  accountAge: 'Keep your account active',
  posts: 'Share more posts with your audience',
  profile: 'Add a profile photo and bio',
  cleanRecord: 'Follow community guidelines',
};

function ProgressBar({ req }: { req: Requirement }) {
  if (typeof req.current === 'string') {
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${req.met ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        {req.current}
      </span>
    );
  }
  const pct = Math.min(100, Math.round((req.current / Number(req.required)) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${req.met ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-600">{req.current}/{req.required}</span>
    </div>
  );
}

export default function BlueTickTracker() {
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/verification-request`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.success) setEligibility(d.data.eligibility || null); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="mb-3 h-48 animate-pulse rounded-lg bg-slate-100" />;
  }
  if (!eligibility) return null;

  const reqs = Object.entries(eligibility.requirements || {});
  const metCount = reqs.filter(([, r]) => r.met).length;

  return (
    <div className="mb-3 rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✓</span>
          <p className="text-sm font-semibold text-slate-800">Blue Tick Eligibility</p>
        </div>
        {eligibility.isVerified ? (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Verified</span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{metCount}/{reqs.length}</span>
        )}
      </div>

      <div className="space-y-3">
        {reqs.map(([key, req]) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-700">{LABELS[key] || key}</p>
              {!req.met && <p className="text-[11px] text-slate-400">{TIPS[key]}</p>}
            </div>
            <ProgressBar req={req} />
          </div>
        ))}
      </div>

      {!eligibility.isVerified && eligibility.eligible && (
        <Link
          href="/settings-menu/verification"
          className="mt-4 block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
        >
          Apply for Verification
        </Link>
      )}
    </div>
  );
}
