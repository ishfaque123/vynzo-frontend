'use client';

import { useEffect, useState } from 'react';
import { fetchMyVerificationRequest } from '@/lib/api/userApi';
import { createPayFastBlueTickPayment, payfastErrorMessage, submitPayFastCheckout } from '@/lib/api/payfastApi';
import Toast from '@/components/Toast';
import VerifiedBadge from '@/components/VerifiedBadge';

type Requirement = { current: number | string; required: number | string; met: boolean };
type Eligibility = {
  eligible: boolean;
  isVerified: boolean;
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
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-slate-200">{icon}</span>
      <span className="text-sm text-white">{children}</span>
    </div>
  );
}

export default function VerificationPage() {
  const [request, setRequest] = useState<any>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [payfastBusy, setPayfastBusy] = useState(false);
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
              <p className="text-sm text-blue-700">Your account already has the Frianzo Blue Tick.</p>
            </div>
          </div>
        </div>
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
    return (
      <div className="mx-auto w-full max-w-xl px-3 py-5 sm:px-4 sm:py-6">
        <button
          type="button"
          onClick={() => setStep('requirements')}
          className="mb-3 text-sm font-medium text-blue-600"
        >
          ← Back to requirements
        </button>

        <div className="rounded-3xl bg-[#0d141c] px-4 py-6 sm:px-5">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-center text-2xl font-bold text-white">Frianzo Blue Tick</h1>
            <VerifiedBadge size="lg" />
          </div>
          <p className="mt-1.5 text-center text-sm text-slate-300">Get verified and stand out.</p>
          <p className="mt-4 text-center text-xs font-medium uppercase tracking-wide text-slate-400">Your plan</p>

          <div className="mt-3 rounded-[18px] bg-[#17242f] p-5">
            <p className="text-[17px] font-bold text-white">Blue Tick</p>
            <p className="mt-1 text-sm text-slate-300">The verified badge for your Frianzo profile</p>
            <p className="mt-0.5 text-sm text-slate-400">PKR400.00/month</p>

            <div className="mt-4 space-y-3">
              <PlanFeature
                icon={
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8.5 12.5l2.4 2.4 4.6-5.4" />
                  </svg>
                }
              >
                Verified badge on your profile, posts and comments
              </PlanFeature>
              <PlanFeature
                icon={
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M4 19V10M9.5 19V5M15 19v-8M20 19V7" />
                  </svg>
                }
              >
                Reach boost for your posts and reels
              </PlanFeature>
              <PlanFeature
                icon={
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M16 16l4.5 4.5" />
                  </svg>
                }
              >
                Appear first in search results
              </PlanFeature>
              <PlanFeature
                icon={
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                    <path d="M3.5 10h17M8 3v4M16 3v4" />
                  </svg>
                }
              >
                Valid for 1 month from activation
              </PlanFeature>
            </div>

            <button
              type="button"
              disabled={payfastBusy}
              onClick={payWithPayFast}
              className="mt-5 w-full rounded-full bg-white/10 py-3 text-sm font-semibold text-[#57abff] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {payfastBusy ? 'Opening secure payment...' : 'Get Blue Tick'}
            </button>
            <p className="mt-2.5 text-center text-[11px] leading-relaxed text-slate-400">
              Your verification request is submitted only after your payment is completed.
              <br />
              Pay by card, JazzCash, Easypaisa, bank account or Raast on PayFast&apos;s secure page.
            </p>
          </div>
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
            <h1 className="text-xl font-semibold text-slate-900">Frianzo Blue Tick</h1>
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
                Complete all requirements above to continue to the Blue Tick plan.
              </p>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
