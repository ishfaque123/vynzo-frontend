'use client';

import { useEffect, useState } from 'react';
import { createVerificationRequest, fetchMyVerificationRequest } from '@/lib/api/userApi';
import Toast from '@/components/Toast';

type Requirement = { current: number; required: number; met: boolean };
type Eligibility = {
  eligible: boolean;
  isVerified: boolean;
  requirements: {
    accountAge: Requirement;
    posts: Requirement;
    reels: Requirement;
    comments: Requirement;
    sharedPosts: Requirement;
  };
};

function RequirementRow({ label, item, suffix = '', icon }: { label: string; item: Requirement; suffix?: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">
          {item.current}{suffix} / {item.required}{suffix} required
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${item.met ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
        {item.met ? 'Complete' : 'Not met'}
      </span>
    </div>
  );
}

export default function VerificationPage() {
  const [request, setRequest] = useState<any>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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
    load();
  }, []);

  async function submit() {
    if (!reason.trim() || !eligibility?.eligible) return;
    setBusy(true);
    const result = await createVerificationRequest(reason.trim());
    setBusy(false);

    if (!result.success) {
      setToast({ message: result.error?.message || 'Could not submit verification request.', type: 'error' });
      return;
    }

    setRequest(result.data.request);
    setEligibility(result.data.eligibility || eligibility);
    setReason('');
    setToast({ message: 'Verification request submitted successfully.', type: 'success' });
  }

  if (loading) {
    return <div className="flex justify-center py-10" role="status" aria-label="Loading verification"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" /></div>;
  }

  if (!eligibility) return null;

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
  const requirementItems = [
    { label: 'Account age', item: r.accountAge, suffix: ' days', icon: '01' },
    { label: 'Posts uploaded', item: r.posts, icon: '02' },
    { label: 'Reels uploaded', item: r.reels, icon: '03' },
    { label: 'Comments made', item: r.comments, icon: '04' },
    { label: 'Posts shared', item: r.sharedPosts, icon: '05' },
  ];
  const completedCount = requirementItems.filter(({ item }) => item.met).length;
  const progress = Math.round((completedCount / requirementItems.length) * 100);
  const pending = request?.status === 'pending';

  return (
    <div className="mx-auto w-full max-w-xl px-3 py-5 sm:px-4 sm:py-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l7 3.5v5.2c0 4.4-3 7.6-7 9.3-4-1.7-7-4.9-7-9.3V6.5L12 3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Verification</h1>
            <p className="text-sm text-slate-500">Apply for the Frianzo Blue Tick.</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
          {requirementItems.map(({ label, item, suffix, icon }) => (
            <RequirementRow key={label} label={label} item={item} suffix={suffix} icon={icon} />
          ))}
        </div>

        {!eligibility.eligible && !request?.status?.includes('pending') && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Complete all requirements above before you can submit a verification request.
          </div>
        )}

        {request?.status === 'pending' && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            Your verification request is pending review. You cannot submit another request while this one is pending.
          </div>
        )}

        {request?.status === 'rejected' && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Your previous request was rejected{request.adminNote ? `: ${request.adminNote}` : '.'}
          </div>
        )}

        {request?.status !== 'pending' && eligibility.eligible && (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">Why should your account be verified?</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="Tell the Frianzo team about your account and why you are requesting verification."
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            <div className="mt-2 text-right text-xs text-slate-400">{reason.length}/1000</div>
            <button
              type="button"
              disabled={busy || !reason.trim()}
              onClick={submit}
              className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Submitting...' : 'Request Verification'}
            </button>
          </div>
        )}

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
