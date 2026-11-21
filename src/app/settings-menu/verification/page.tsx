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
  verifiedAt?: string | null;
  username?: string | null;
  displayName?: string | null;
  country?: string | null;
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

// Display price for the Verified plan in the viewer's own country
// currency (amounts are the PKR 400 price converted per country).
// Display only — charging still happens in PKR. Any country not
// listed here falls back to the PKR price.
const PLAN_PRICE_BY_COUNTRY: Record<string, { prefix: string; amount: string }> = {
  PK: { prefix: 'PKR ', amount: '400' },
  IN: { prefix: '₹', amount: '129' },
  BD: { prefix: '৳', amount: '170' },
  NP: { prefix: 'Rs ', amount: '199' },
  LK: { prefix: 'Rs ', amount: '449' },
  BT: { prefix: 'Nu. ', amount: '129' },
  MV: { prefix: 'MVR ', amount: '21.99' },
  AF: { prefix: 'Af ', amount: '99' },
  US: { prefix: '$', amount: '1.49' },
  CA: { prefix: 'C$', amount: '1.99' },
  MX: { prefix: 'MX$', amount: '29' },
  BR: { prefix: 'R$ ', amount: '7.99' },
  AR: { prefix: '$', amount: '1,490' },
  CO: { prefix: 'COP ', amount: '5,900' },
  CL: { prefix: 'CLP ', amount: '1,390' },
  PE: { prefix: 'S/ ', amount: '5.49' },
  GB: { prefix: '£', amount: '1.19' },
  UK: { prefix: '£', amount: '1.19' },
  IE: { prefix: '€', amount: '1.29' },
  DE: { prefix: '€', amount: '1.29' },
  FR: { prefix: '€', amount: '1.29' },
  IT: { prefix: '€', amount: '1.29' },
  ES: { prefix: '€', amount: '1.29' },
  PT: { prefix: '€', amount: '1.29' },
  NL: { prefix: '€', amount: '1.29' },
  BE: { prefix: '€', amount: '1.29' },
  AT: { prefix: '€', amount: '1.29' },
  FI: { prefix: '€', amount: '1.29' },
  GR: { prefix: '€', amount: '1.29' },
  HR: { prefix: '€', amount: '1.29' },
  SI: { prefix: '€', amount: '1.29' },
  SK: { prefix: '€', amount: '1.29' },
  LT: { prefix: '€', amount: '1.29' },
  LV: { prefix: '€', amount: '1.29' },
  EE: { prefix: '€', amount: '1.29' },
  CY: { prefix: '€', amount: '1.29' },
  MT: { prefix: '€', amount: '1.29' },
  LU: { prefix: '€', amount: '1.29' },
  MC: { prefix: '€', amount: '1.29' },
  SM: { prefix: '€', amount: '1.29' },
  VA: { prefix: '€', amount: '1.29' },
  AD: { prefix: '€', amount: '1.29' },
  ME: { prefix: '€', amount: '1.29' },
  XK: { prefix: '€', amount: '1.29' },
  CH: { prefix: 'CHF ', amount: '1.29' },
  SE: { prefix: 'kr ', amount: '14.99' },
  NO: { prefix: 'kr ', amount: '15.99' },
  DK: { prefix: 'kr ', amount: '9.99' },
  IS: { prefix: 'ISK ', amount: '189' },
  PL: { prefix: 'zł', amount: '5.79' },
  CZ: { prefix: 'CZK ', amount: '29.99' },
  HU: { prefix: 'HUF ', amount: '499' },
  RO: { prefix: 'RON ', amount: '6.49' },
  BG: { prefix: 'BGN ', amount: '2.49' },
  RS: { prefix: 'RSD ', amount: '149' },
  BA: { prefix: 'BAM ', amount: '2.49' },
  MK: { prefix: 'MKD ', amount: '79' },
  AL: { prefix: 'ALL ', amount: '129' },
  RU: { prefix: '₽', amount: '129' },
  UA: { prefix: '₴', amount: '59' },
  BY: { prefix: 'Br ', amount: '4.99' },
  MD: { prefix: 'MDL ', amount: '24.99' },
  TR: { prefix: '₺', amount: '59' },
  SA: { prefix: 'SAR ', amount: '5.49' },
  AE: { prefix: 'AED ', amount: '5.49' },
  QA: { prefix: 'QAR ', amount: '5.49' },
  KW: { prefix: 'KD ', amount: '0.49' },
  OM: { prefix: 'OMR ', amount: '0.59' },
  BH: { prefix: 'BHD ', amount: '0.59' },
  IQ: { prefix: 'IQD ', amount: '1,900' },
  IL: { prefix: '₪', amount: '4.99' },
  PS: { prefix: '₪', amount: '4.99' },
  JO: { prefix: 'JD ', amount: '0.99' },
  EG: { prefix: 'E£', amount: '69' },
  MA: { prefix: 'MAD ', amount: '14.99' },
  DZ: { prefix: 'DZD ', amount: '189' },
  NG: { prefix: '₦', amount: '2,190' },
  KE: { prefix: 'KSh ', amount: '189' },
  TZ: { prefix: 'TSh ', amount: '3,690' },
  UG: { prefix: 'USh ', amount: '5,290' },
  ZA: { prefix: 'R', amount: '25.99' },
  GH: { prefix: 'GH₵', amount: '17.99' },
  ET: { prefix: 'ETB ', amount: '189' },
  MZ: { prefix: 'MT ', amount: '89' },
  ZM: { prefix: 'K', amount: '36.99' },
  CN: { prefix: '¥', amount: '9.99' },
  JP: { prefix: '¥', amount: '219' },
  KR: { prefix: '₩', amount: '1,990' },
  ID: { prefix: 'Rp ', amount: '23,900' },
  MY: { prefix: 'RM ', amount: '6.49' },
  SG: { prefix: 'S$', amount: '1.89' },
  TH: { prefix: '฿', amount: '49' },
  VN: { prefix: '₫', amount: '35,000' },
  PH: { prefix: '₱', amount: '85' },
  KH: { prefix: '$', amount: '1.49' },
  LA: { prefix: '₭', amount: '29,900' },
  MM: { prefix: 'MMK ', amount: '2,990' },
  BN: { prefix: 'B$', amount: '1.89' },
  HK: { prefix: 'HK$', amount: '11.99' },
  TW: { prefix: 'NT$', amount: '45' },
  MN: { prefix: '₮', amount: '4,990' },
  UZ: { prefix: "so'm ", amount: '17,900' },
  KZ: { prefix: '₸', amount: '690' },
  KG: { prefix: 'som ', amount: '129' },
  TJ: { prefix: 'TJS ', amount: '15.49' },
  AZ: { prefix: '₼', amount: '2.49' },
  GE: { prefix: '₾', amount: '3.99' },
  AM: { prefix: '֏', amount: '579' },
  AU: { prefix: 'A$', amount: '2.19' },
  NZ: { prefix: 'NZ$', amount: '2.49' },
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
      setToast({ message: 'Payment received. If your verification is not active yet, it will activate within a few moments.', type: 'success' });
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
    setToast({ message: 'Your verification request has been submitted successfully. The Frianzo team will review and verify your account within 24 hours.', type: 'success' });
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
    const formatDate = (iso?: string | null) =>
      iso ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : null;
    const verifiedSince = formatDate(eligibility.verifiedAt);
    const expiresOn = formatDate(eligibility.verifiedUntil);
    const daysLeft = eligibility.verifiedUntil
      ? Math.max(0, Math.ceil((new Date(eligibility.verifiedUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;
    const benefits = [
      'Verified badge on your profile and posts',
      'Reach boost for your posts',
      'Search priority in results',
      'Every post in feed',
      'Bold follow button',
      'Human support',
    ];
    const detailRow = (label: string, value: React.ReactNode, sub?: string | null) => (
      <div className="py-2">
        <p className="text-[12px] font-semibold text-[#64748b] dark:text-[#93a5b1]">{label}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[15px] font-bold text-[#0f172a] dark:text-[#ffffff]">{value}</div>
        {sub && <p className="mt-0.5 text-[12px] text-[#64748b] dark:text-[#93a5b1]">{sub}</p>}
      </div>
    );
    return (
      <div className="mx-auto w-full max-w-xl px-3 py-5 sm:px-4 sm:py-6">
        <div className="font-manrope rounded-[28px] border border-[#e2e8f0] bg-[#ffffff] px-3.5 pb-6 pt-8 dark:border-transparent dark:bg-[#0c1115] sm:px-6">
          <div className="flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2f89ff] text-white">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
          </div>
          <h1 className="mt-4 text-center text-[25px] font-extrabold leading-tight text-[#0f172a] dark:text-[#ffffff]">You’re Verified</h1>
          <p className="mt-1.5 text-center text-[14px] text-[#64748b] dark:text-[#c4cfd6]">Your account is verified.</p>

          <div className="mt-7 divide-y divide-[#e2e8f0] rounded-[26px] border border-[#e2e8f0] bg-[#f8fafc] px-5 py-2 dark:divide-[#344452] dark:border-transparent dark:bg-[#1b2833]">
            {detailRow('Account', (
              <>
                {eligibility.displayName || eligibility.username || 'Your account'}
                <VerifiedBadge size="sm" />
              </>
            ))}
            {detailRow('Status', daysLeft !== null && daysLeft <= 7 ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Expiring Soon
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active
              </>
            ))}
            {verifiedSince && detailRow('Verified since', verifiedSince)}
            {detailRow('Plan', 'Verified')}
            {detailRow('Expires', expiresOn || 'No expiry')}
          </div>

          <h2 className="mt-6 text-[15px] font-bold text-[#0f172a] dark:text-[#ffffff]">Your benefits</h2>
          <div className="mt-1.5 space-y-2.5">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-2.5">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#2f89ff] text-white">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span className="text-[14px] text-[#475569] dark:text-[#c4cfd6]">{b}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-[12px] text-[#94a3b8] dark:text-[#93a5b1]">
            Questions? Contact{' '}
            <a href="mailto:support@frianzo.online" className="font-semibold text-[#2f89ff] no-underline">
              support@frianzo.online
            </a>
          </p>
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
    const planPrice = PLAN_PRICE_BY_COUNTRY[(eligibility.country || 'PK').toUpperCase()] || PLAN_PRICE_BY_COUNTRY.PK;
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
                <span className="font-medium text-[#93a5b1]">{planPrice.prefix}<span className="line-through">{planPrice.amount}</span></span>{' '}
                <span className="font-bold text-white">0/month</span>
              </p>
            ) : (
              <p className="mt-3 text-[17px] font-medium text-[#93a5b1]">{planPrice.prefix}{planPrice.amount}/month</p>
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

          {pending ? (
            <>
              <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center">
                <p className="text-[15px] leading-relaxed text-emerald-100">
                  Your verification request has been submitted successfully. The Frianzo team will review and verify your account within 24 hours.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="mt-5 w-full rounded-full bg-[#1877f2] py-3.5 text-[17px] font-bold text-white opacity-50"
              >
                Request Submitted
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={claimBusy || payfastBusy}
              onClick={freeAvailable ? claimFreeMonth : payWithPayFast}
              className="mt-5 w-full rounded-full bg-[#1877f2] py-3.5 text-[17px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {claimBusy || payfastBusy ? 'Please wait...' : 'Get Verified'}
            </button>
          )}
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-3 py-5 sm:px-4 sm:py-6">
      <div>
        <div className="flex items-center gap-3">
          <VerifiedBadge size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Frianzo Verified</h1>
            <p className="text-sm text-slate-500">Get verified and stand out.</p>
          </div>
        </div>

        <p className="mt-5 text-sm font-semibold text-slate-900">Step 1 of 2 — Complete the requirements</p>

        <div className="mt-3">
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

        <div className="mt-4">
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
