'use client';

import { useEffect, useState } from 'react';
import { fetchMyVerificationRequest, claimFreeVerificationMonth } from '@/lib/api/userApi';
import { createPayFastBlueTickPayment, payfastErrorMessage, submitPayFastCheckout } from '@/lib/api/payfastApi';
import Toast from '@/components/Toast';
import VerifiedBadge from '@/components/VerifiedBadge';

type Requirement = { current: number | string; required: number | string; met: boolean };
type Eligibility = {
  eligible: boolean;
  isVerified: boolean;
  verifiedUntil?: string | null;
  freeMonthClaimed?: boolean;
  requirements: {
    referrals: Requirement;
    followers: Requirement;
    accountAge: Requirement;
    posts: Requirement;
    profile: Requirement;
    cleanRecord: Requirement;
  };
};

function RequirementRow({ label, item, suffix = '' }: { label: string; item: Requirement; suffix?: string }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          item.met ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 text-transparent'
        }`}
      >
        ✓
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">
          {item.current}{suffix} / {item.required}{suffix}{typeof item.required === 'number' ? ' required' : ''}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${item.met ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
        {item.met ? 'Complete' : 'Not met'}
      </span>
    </div>
  );
}

function PlanFeature({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="shrink-0 text-slate-100">{icon}</span>
      <span className="text-[17px] text-white">{children}</span>
    </div>
  );
}

export default function VerificationPage() {
  const [request, setRequest] = useState<any>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [payfastBusy, setPayfastBusy] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const [step, setStep] = useState<'requirements' | 'plan'>('requirements');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function load() {
    setLoading(true);
    const result = await fetchMyVerificationRequest();
    if (result.success) {
      setRequest(result.data.request || null);
      setEligibility(result.data.eligibility || null);
    } else {
      setToast({ message: result.error?.message || 'Could not load verification status.', type: 'error' });
    }
    setLoading(false);
  }

  useEffect(() => {
    // Returning from PayFast's hosted page: the backend return
    // endpoints redirect here with ?payfast=success|failed. The tick
    // itself is activated only by the verified server callback, so a
    // success flag can land a few moments before the badge shows.
    const flag = new URLSearchParams(window.location.search).get('payfast');
    if (flag === 'success') {
      setToast({ message: 'Payment received. If your Blue Tick is not active yet, it will activate within a few moments.', type: 'success' });
    } else if (flag === 'failed') {
      setToast({ message: 'Your payment was not completed. You can try again.', type: 'error' });
    }
    load();
  }, []);

  async function payWithPayFast() {
    setPayfastBusy(true);
    const result = await createPayFastBlueTickPayment();
    if (!result.success) {
      setPayfastBusy(false);
      setToast({ message: payfastErrorMessage(result), type: 'error' });
      return;
    }
    // Navigates the browser/WebView away to PayFast's payment page.
    submitPayFastCheckout(result.data.checkout);
  }

  async function claimFreeMonth() {
    setClaimBusy(true);
    const result = await claimFreeVerificationMonth();
    setClaimBusy(false);
    if (!result.success) {
      setToast({ message: result.error?.message || 'Could not activate verification. Please try again.', type: 'error' });
      return;
    }
    setToast({ message: 'You are now verified for 30 days.', type: 'success' });
    await load();
  }

  if (loading) {
    return <div className="flex justify-center py-10" role="status" aria-label="Loading verification"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" /></div>;
  }

  if (!eligibility) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center">
        <p className="text-sm text-slate-500">Could not load verification status.</p>
        <button
          type="button"
          onClick={load}
          className="mt-3 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (eligibility.isVerified) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">You’re Verified</h1>
              <p className="text-sm text-blue-700">Your account is verified.</p>
              {eligibility.verifiedUntil && (
                <p className="text-sm text-blue-700">Active until {new Date(eligibility.verifiedUntil).toLocaleDateString()}.</p>
              )}
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  const r = eligibility.requirements;
  // Fallbacks keep this page alive even if the API shape ever changes again —
  // a missing requirement must show as "not met", never crash the page.
  const requirementItems = [
    { label: 'Referrals invited', item: r.referrals || { current: 0, required: 25, met: false } },
    { label: 'Followers', item: r.followers || { current: 0, required: 100, met: false } },
    { label: 'Account age', item: r.accountAge || { current: 0, required: 30, met: false }, suffix: ' days' },
    { label: 'Profile complete', item: r.profile || { current: 'Incomplete', required: 'Photo + Bio', met: false } },
    { label: 'Clean record', item: r.cleanRecord || { current: 'Clean', required: 'No violations (90d)', met: false } },
  ];
  const completedCount = requirementItems.filter(({ item }) => item.met).length;
  const progress = Math.round((completedCount / requirementItems.length) * 100);
  const pending = request?.status === 'pending';

  if (step === 'plan') {
    const freeAvailable = !eligibility.freeMonthClaimed;
    return (
      <div className="mx-auto w-full max-w-xl px-3 py-5 sm:px-4 sm:py-6">
        <div className="font-manrope rounded-[28px] bg-[#0c1115] px-5 pb-6 pt-4 sm:px-6">
          <button
            type="button"
            onClick={() => setStep('requirements')}
            aria-label="Back to requirements"
            className="text-white"
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <h1 className="mt-3 text-center text-[34px] font-extrabold leading-tight text-white">Frianzo Verified</h1>
          <p className="mt-1.5 text-center text-[17px] text-[#c4cfd6]">Stand out with a verified profile</p>

          <div className="mt-7 rounded-[26px] bg-[#1b2833] p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[20px] font-bold text-white">Verified</p>
              <p className="text-[15px] font-semibold text-[#2f89ff]">Recommended</p>
            </div>
            <p className="mt-3 text-[17px] leading-snug text-white">Get next level insights. Reach new audiences.</p>
            {freeAvailable ? (
              <p className="mt-3 text-[17px]">
                <span className="font-medium text-[#93a5b1]">PKR <span className="line-through">400</span></span>{' '}
                <span className="font-bold text-white">0/month</span>
              </p>
            ) : (
              <p className="mt-3 text-[17px] font-medium text-[#93a5b1]">PKR 400/month</p>
            )}

            <div className="mt-6 space-y-6">
              <PlanFeature
                icon={
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8.5 12.5l2.4 2.4 4.6-5.4" />
                  </svg>
                }
              >
                Verified badge
              </PlanFeature>
              <PlanFeature
                icon={
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M4 16.5l4-5 3.5 3L17 8" />
                    <path d="M13.5 8H17v3.5" />
                  </svg>
                }
              >
                Reach boost
              </PlanFeature>
              <PlanFeature
                icon={
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M16 16l4.5 4.5" />
                  </svg>
                }
              >
                Search priority
              </PlanFeature>
              <PlanFeature
                icon={
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                    <path d="M3.5 10h17M8 3v4M16 3v4" />
                  </svg>
                }
              >
                30 days
              </PlanFeature>
              <PlanFeature
                icon={
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="3.5" y="5" width="17" height="14" rx="3" />
                    <circle cx="8.5" cy="10" r="1.3" fill="currentColor" stroke="none" />
                    <path d="M7 15.5h10" />
                  </svg>
                }
              >
                Every post in feed
              </PlanFeature>
              <PlanFeature
                icon={
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="10" cy="8" r="3.5" />
                    <path d="M4.5 19c.6-3 2.8-4.5 5.5-4.5 1 0 1.9.2 2.7.6" />
                    <path d="M17.5 15v6M14.5 18h6" />
                  </svg>
                }
              >
                Bold follow button
              </PlanFeature>
              <PlanFeature
                icon={
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M4.5 15v-2.5a7.5 7.5 0 0115 0V15" />
                    <rect x="3.5" y="14" width="4" height="6" rx="2" />
                    <rect x="16.5" y="14" width="4" height="6" rx="2" />
                  </svg>
                }
              >
                Human support
              </PlanFeature>
            </div>
          </div>

          <button
            type="button"
            disabled={claimBusy || payfastBusy}
            onClick={freeAvailable ? claimFreeMonth : payWithPayFast}
            className="mt-5 w-full rounded-full bg-[#1877f2] py-3.5 text-[17px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {claimBusy || payfastBusy ? 'Please wait...' : 'Get Verified'}
          </button>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-3 py-5 sm:px-4 sm:py-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <VerifiedBadge size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Frianzo Verified</h1>
            <p className="text-sm text-slate-500">Get verified and stand out.</p>
          </div>
        </div>

        <p className="mt-5 text-sm font-semibold text-slate-900">Step 1 of 2 — Complete the requirements</p>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Eligibility progress</p>
              <p className="text-xs text-slate-500">{completedCount} of {requirementItems.length} requirements complete</p>
            </div>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: progress + '%' }} />
          </div>
        </div>

        <div className="mt-4 divide-y rounded-2xl border px-4">
          {requirementItems.map(({ label, item, suffix }) => (
            <RequirementRow key={label} label={label} item={item} suffix={suffix} />
          ))}
        </div>

        {pending && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Your verification request is pending review. You cannot submit another request while this one is pending.
          </div>
        )}

        {request?.status === 'rejected' && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Your previous request was rejected{request.adminNote ? `: ${request.adminNote}` : '.'}
          </div>
        )}

        {!pending && (
          <>
            <button
              type="button"
              disabled={!eligibility.eligible}
              onClick={() => setStep('plan')}
              className="mt-5 w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
            {!eligibility.eligible && (
              <p className="mt-2 text-center text-xs text-slate-400">
                Complete all requirements above to continue to the plan.
              </p>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
