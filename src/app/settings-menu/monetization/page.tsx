'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard } from '@/lib/api/userApi';

function MonetizationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <circle cx="12" cy="14.5" r="1.5" />
    </svg>
  );
}

type ReferralData = {
  status: 'locked' | 'eligible';
  referrals: number;
  requiredReferrals: number;
  progress: number;
  referralLink: string | null;
};

export default function MonetizationPage() {
  const [data, setData] = useState<ReferralData | null>(null);

  useEffect(() => {
    fetchDashboard().then((result) => {
      if (result.success) setData(result.data?.monetization ?? null);
    });
  }, []);

  const requiredReferrals = data?.requiredReferrals ?? 25;
  const referrals = data?.referrals ?? 0;
  const progress = data?.progress ?? 0;
  const eligible = data?.status === 'eligible';

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-slate-700"><MonetizationIcon /></span>
        <h1 className="text-xl font-semibold">Monetization</h1>
      </div>

      <div className="mb-3 rounded-lg border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Monetization eligibility</p>
            <p className="mt-1 text-xs text-slate-500">
              {eligible
                ? 'You have completed the 25-referral requirement.'
                : 'Complete ' + requiredReferrals + ' valid referrals to become eligible.'}
            </p>
          </div>
          <span className={eligible
            ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700'
            : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'}>
            {eligible ? 'Eligible' : 'Locked'}
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>{referrals} / {requiredReferrals} referrals</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: progress + '%' }} />
          </div>
        </div>

        {eligible && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Monetization eligibility unlocked. Application flow will be added next.
          </p>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Your referral link</p>
        <p className="mt-1 text-xs text-slate-500">
          Share this Google Play link. A valid first-time referral counts toward your 25-referral requirement.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            readOnly
            value={data?.referralLink ?? ''}
            placeholder="Complete your profile to get a referral link"
            className="min-w-0 flex-1 rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-700"
          />
          <button
            type="button"
            disabled={!data?.referralLink}
            onClick={() => {
              if (data?.referralLink) navigator.clipboard?.writeText(data.referralLink);
            }}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
