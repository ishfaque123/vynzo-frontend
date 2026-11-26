'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchDashboard } from '@/lib/api/userApi';
import {
  fetchPayoutMethods, addPayoutMethod, deletePayoutMethod, setDefaultPayoutMethod,
  fetchEarnings, fetchReferralsList, fetchEarningsByContent, fetchPayoutHistory,
} from '@/lib/api/payoutApi';
import Toast from '@/components/Toast';
import Skeleton from '@/components/Skeleton';

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
  earningPerReferral?: number;
  freeReferrals?: number;
};

type PayoutMethod = {
  id: string;
  country: string;
  methodType: string;
  methodLabel: string;
  accountName: string;
  accountNumber: string;
  extra?: string | null;
  isDefault: boolean;
};

type ReferralUser = {
  username: string;
  displayName: string | null;
  avatar: string | null;
  joinedAt: string;
  lastActiveAt?: string | null;
  active: boolean;
};

type ContentEarning = {
  id: string;
  kind: 'post' | 'reel';
  title: string;
  thumbnail: string | null;
  views: number | null;
  amount: number;
};

type PayoutRow = {
  id: string;
  amount: number;
  status: string;
  methodLabel: string | null;
  createdAt: string;
};

const WITHDRAWAL_TARGET = 25;
const SHARE_CAPTION = 'Join me on Frianzo — watch reels, post photos and earn from your views. Sign up with my link.';

function formatCount(n: number): string {
  if (n < 10000) return n.toLocaleString('en-US');
  if (n < 1000000) { const k = Math.round(n / 100) / 10; return k >= 1000 ? '1M' : `${k % 1 === 0 ? k : k.toFixed(1)}k`; }
  if (n < 1000000000) { const m = Math.round(n / 100000) / 10; return m >= 1000 ? '1B' : `${m % 1 === 0 ? m : m.toFixed(1)}M`; }
  const b = Math.round(n / 100000000) / 10; return `${b % 1 === 0 ? b : b.toFixed(1)}B`;
}

function joinedLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function lastActiveLabel(iso: string | null | undefined, joinedIso: string): string {
  if (!iso) return `Joined ${joinedLabel(joinedIso)}`;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return `Joined ${joinedLabel(joinedIso)}`;
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 5) return 'Active now';
  if (mins < 60) return `Last active ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Last active ${days}d ago`;
  return `Last active ${joinedLabel(iso)}`;
}

function payoutDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const MONETIZATION_CACHE_KEY = 'frianzo:monetizationCache';

function readMonetizationCache(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(MONETIZATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeMonetizationCache(patch: Record<string, unknown>) {
  try {
    const current = readMonetizationCache() || {};
    localStorage.setItem(MONETIZATION_CACHE_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    // Best-effort only.
  }
}

export default function MonetizationPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [earnings, setEarnings] = useState<{ total: number; totalPaid: number } | null>(null);
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [allowed, setAllowed] = useState<Record<string, { code: string; label: string; fields: any }[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);
  const [form, setForm] = useState({ methodType: '', accountName: '', accountNumber: '', extra: '' });
  const [saving, setSaving] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [referralsData, setReferralsData] = useState<{ invited: number; activeDaily: number; referrals: ReferralUser[] } | null>(null);
  const [contentEarnings, setContentEarnings] = useState<ContentEarning[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const hasDataRef = useRef(false);

  function load() {
    // Only the very first load shows the full-page skeleton; later refreshes
    // keep the current content on screen and update it silently.
    if (!hasDataRef.current) setLoading(true);
    setError(false);
    if (!hasDataRef.current) {
      // Cache-first: paint the last data instantly on reload, then refresh
      // it silently in the background.
      const cached = readMonetizationCache();
      if (cached) {
        if (cached.data) setData(cached.data);
        if (cached.earnings) setEarnings(cached.earnings);
        if (cached.methods) setMethods(cached.methods);
        if (cached.allowed) setAllowed(cached.allowed);
        if ('userCountry' in cached) setUserCountry(cached.userCountry);
        if (cached.referralsData) setReferralsData(cached.referralsData);
        if (cached.contentEarnings) setContentEarnings(cached.contentEarnings);
        if (cached.payouts) setPayouts(cached.payouts);
        hasDataRef.current = true;
        setLoading(false);
      }
    }
    Promise.all([fetchDashboard(), fetchPayoutMethods(), fetchEarnings(), fetchReferralsList(), fetchEarningsByContent(), fetchPayoutHistory()])
      .then(([dResult, mResult, eResult, rResult, cResult, hResult]) => {
        if (dResult.success) { setData(dResult.data?.monetization ?? null); hasDataRef.current = true; }
        else if (hasDataRef.current) { setToast({ message: 'Could not refresh. Please try again.', type: 'error' }); return; }
        else { setError(true); return; }
        if (mResult.success) {
          setMethods(mResult.data.methods || []);
          setAllowed(mResult.data.allowed || {});
          setUserCountry(mResult.data.country || null);
        }
        if (eResult.success) setEarnings({ total: eResult.data.total ?? 0, totalPaid: eResult.data.totalPaid ?? 0 });
        if (rResult.success) setReferralsData(rResult.data);
        if (cResult.success) setContentEarnings(cResult.data.items || []);
        if (hResult.success) setPayouts(hResult.data.payouts || []);
        const patch: Record<string, unknown> = {};
        if (dResult.success) patch.data = dResult.data?.monetization ?? null;
        if (mResult.success) { patch.methods = mResult.data.methods || []; patch.allowed = mResult.data.allowed || {}; patch.userCountry = mResult.data.country || null; }
        if (eResult.success) patch.earnings = { total: eResult.data.total ?? 0, totalPaid: eResult.data.totalPaid ?? 0 };
        if (rResult.success) patch.referralsData = rResult.data;
        if (cResult.success) patch.contentEarnings = cResult.data.items || [];
        if (hResult.success) patch.payouts = hResult.data.payouts || [];
        if (Object.keys(patch).length) writeMonetizationCache(patch);
      })
      .catch(() => {
        if (hasDataRef.current) setToast({ message: 'Could not refresh. Please try again.', type: 'error' });
        else setError(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleCopy() {
    if (!data?.referralLink) return;
    navigator.clipboard?.writeText(data.referralLink).then(
      () => setToast({ message: 'Referral link copied.', type: 'success' }),
      () => setToast({ message: 'Could not copy link.', type: 'error' }),
    );
  }

  function shareText() {
    return `${SHARE_CAPTION} ${data?.referralLink ?? ''}`.trim();
  }

  function shareWhatsApp() {
    if (!data?.referralLink) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, '_blank');
  }

  function shareFacebook() {
    if (!data?.referralLink) return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.referralLink)}&quote=${encodeURIComponent(SHARE_CAPTION)}`;
    window.open(url, '_blank');
  }

  async function handleSaveMethod() {
    if (!form.methodType || !form.accountName.trim() || !form.accountNumber.trim() || saving) return;
    setSaving(true);
    try {
      const result = await addPayoutMethod({
        methodType: form.methodType,
        accountName: form.accountName.trim(),
        accountNumber: form.accountNumber.trim(),
        extra: form.extra.trim() || undefined,
      });
      if (!result.success) {
        setToast({ message: result.error?.message || 'Could not save payout method.', type: 'error' });
        return;
      }
      const newMethod: PayoutMethod = result.data.method;
      if (replaceMode) {
        // Replace: remove every old method, keep only the new one as default.
        const oldOnes = methods.filter((m) => m.id !== newMethod.id);
        for (const old of oldOnes) {
          await deletePayoutMethod(old.id).catch(() => {});
        }
        if (!newMethod.isDefault) await setDefaultPayoutMethod(newMethod.id).catch(() => {});
        setMethods([{ ...newMethod, isDefault: true }]);
        setToast({ message: 'Payout method updated.', type: 'success' });
      } else {
        setMethods((prev) => [newMethod, ...prev.map((m) => ({ ...m, isDefault: newMethod.isDefault ? false : m.isDefault }))]);
        setToast({ message: 'Payout method added.', type: 'success' });
      }
      setShowAdd(false);
      setReplaceMode(false);
      setForm({ methodType: '', accountName: '', accountNumber: '', extra: '' });
    } catch {
      setToast({ message: 'Could not save payout method.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-36" />
        </div>
        <Skeleton className="mb-3 h-44 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-slate-500">Could not load monetization info. Please try again.</p>
        <button onClick={load} className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white">
          Try again
        </button>
      </div>
    );
  }

  const requiredReferrals = data?.requiredReferrals ?? 25;
  const referralsCount = data?.referrals ?? 0;
  const progress = data?.progress ?? 0;
  const eligible = data?.status === 'eligible';
  const countryMethods = userCountry ? (allowed[userCountry] || []) : [];
  const selectedMethod = countryMethods.find((m) => m.code === form.methodType);
  const total = earnings?.total ?? 0;
  const totalPaid = earnings?.totalPaid ?? 0;
  const available = Math.max(0, total - totalPaid);
  const barPct = Math.min(100, (available / WITHDRAWAL_TARGET) * 100);
  const link = data?.referralLink ?? '';

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-slate-700"><MonetizationIcon /></span>
        <h1 className="text-xl font-semibold">Monetization</h1>
      </div>

      {/* Earnings */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-semibold text-slate-900">Earnings</p>
          <span className={eligible
            ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700'
            : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'}>
            {eligible ? 'Eligible' : 'Locked'}
          </span>
        </div>
        <p className="mt-1 text-[32px] font-semibold leading-tight text-slate-900">${total.toFixed(2)}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: barPct + '%' }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>${available.toFixed(2)} of ${WITHDRAWAL_TARGET}</span>
          <span>${WITHDRAWAL_TARGET}</span>
        </div>
        <p className="mt-2 text-[13px] text-slate-700">At $25, your earnings are sent to your bank automatically.</p>
        {!eligible && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>{referralsCount} / {requiredReferrals} referrals to unlock</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: progress + '%' }} />
            </div>
          </div>
        )}
      </div>

      {/* Referral link + share */}
      <div className="mb-6">
        <p className="text-base font-semibold text-slate-900">Your referral link</p>
        <button type="button" disabled={!link} onClick={handleCopy} className="mt-3 w-full rounded-xl bg-blue-600 py-3.5 text-[15px] font-semibold text-white disabled:opacity-40">
          Copy Link
        </button>
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={!link} onClick={shareWhatsApp} className="flex-1 rounded-lg bg-[#25d366] py-2.5 text-[13px] font-medium text-white disabled:opacity-40">
            WhatsApp
          </button>
          <button type="button" disabled={!link} onClick={shareFacebook} className="flex-1 rounded-lg bg-[#1877f2] py-2.5 text-[13px] font-medium text-white disabled:opacity-40">
            Facebook
          </button>
        </div>
      </div>

      {/* Earnings by video — only for users whose monetization is on */}
      {eligible && (
      <div className="mb-6">
        <p className="text-base font-semibold text-slate-900">Earnings by video & photo</p>
        {contentEarnings.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No video earnings yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {contentEarnings.map((item) => (
              <a key={item.id} href={item.kind === 'reel' ? `/reels?id=${item.id}` : `/post/${item.id}`} className="flex items-center gap-3">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" loading="lazy" className="h-[54px] w-[86px] shrink-0 rounded-lg bg-slate-200 object-cover" />
                ) : (
                  <span className="flex h-[54px] w-[86px] shrink-0 items-center justify-center rounded-lg bg-slate-200">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{item.title}</span>
                  <span className="block text-xs text-slate-500">{item.views !== null ? `${formatCount(item.views)} views` : ''}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-emerald-600">+${item.amount.toFixed(2)}</span>
              </a>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Your referrals */}
      <div id="referrals" className="mb-6 scroll-mt-4">
        <p className="text-base font-semibold text-slate-900">Your referrals</p>
        {!referralsData || referralsData.referrals.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No referrals yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {referralsData.referrals.map((r) => (
              <a key={r.username} href={`/u/${r.username}`} className="flex items-center gap-3">
                {r.avatar ? (
                  <img src={r.avatar} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-full bg-slate-200 object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                    {(r.displayName || r.username).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{r.displayName || r.username}</span>
                  <span className="block text-xs text-slate-500">{lastActiveLabel(r.lastActiveAt, r.joinedAt)}</span>
                </span>
                {r.active ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-slate-400">Inactive</span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Payout methods */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-slate-900">Payout methods</p>
          {methods.length > 0 ? (
            <button onClick={() => { setReplaceMode(true); setForm({ methodType: '', accountName: '', accountNumber: '', extra: '' }); setShowAdd(true); }} className="text-[13px] font-medium text-blue-600">Change</button>
          ) : (
            <button onClick={() => { setReplaceMode(false); setShowAdd(true); }} className="text-[13px] font-medium text-blue-600">+ Add</button>
          )}
        </div>
        {methods.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No payout method added yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {methods.map((m) => (
              <div key={m.id}>
                <p className="text-sm font-medium text-slate-900">{m.methodLabel}</p>
                <p className="truncate text-xs text-slate-500">{m.accountName} · {m.accountNumber}{m.extra ? ` · ${m.extra}` : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout history */}
      <div className="mb-6">
        <p className="text-base font-semibold text-slate-900">Payout history</p>
        {payouts.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No payouts yet.</p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="flex-1 text-[13px] text-slate-700">{payoutDateLabel(p.createdAt)}{p.methodLabel ? ` · ${p.methodLabel}` : ''}</span>
                <span className="text-[13px] font-semibold text-slate-900">${p.amount.toFixed(2)}</span>
                <span className={p.status === 'sent'
                  ? 'rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700'
                  : 'rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600'}>
                  {p.status === 'sent' ? 'Sent' : p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-base font-semibold">{replaceMode ? 'Change payout method' : 'Add payout method'}</h3>
            {!userCountry && (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Please set your country in your profile first.
              </p>
            )}
            <label className="mb-1 block text-xs font-medium text-slate-600">Method</label>
            <div className="mb-3 flex gap-2">
              {countryMethods.map((m) => (
                <button
                  key={m.code}
                  onClick={() => setForm((f) => ({ ...f, methodType: m.code }))}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium ${form.methodType === m.code ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-slate-200 text-slate-600'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Account holder name</label>
            <input
              value={form.accountName}
              onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
              placeholder="Full name"
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <label className="mb-1 block text-xs font-medium text-slate-600">{selectedMethod?.fields.accountNumber || 'Account number'}</label>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
              placeholder={selectedMethod?.fields.accountNumber || 'Account number'}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            {selectedMethod?.fields.extra && (
              <>
                <label className="mb-1 block text-xs font-medium text-slate-600">{selectedMethod.fields.extra}</label>
                <input
                  value={form.extra}
                  onChange={(e) => setForm((f) => ({ ...f, extra: e.target.value }))}
                  placeholder={selectedMethod.fields.extra}
                  className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </>
            )}
            <button
              onClick={handleSaveMethod}
              disabled={saving || !userCountry || !form.methodType || !form.accountName.trim() || !form.accountNumber.trim()}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : replaceMode ? 'Save new method' : 'Add payout method'}
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
