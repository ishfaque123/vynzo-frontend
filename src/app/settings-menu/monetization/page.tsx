'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard, fetchLeaderboard } from '@/lib/api/userApi';
import { fetchPayoutMethods, addPayoutMethod, deletePayoutMethod, setDefaultPayoutMethod, fetchEarnings } from '@/lib/api/payoutApi';
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

type Earning = { id: string; amount: number; type: string; createdAt: string };

type LeaderboardEntry = {
  rank: number;
  username: string;
  displayName: string | null;
  avatar: string | null;
  isVerified: boolean;
  count: number;
};

type LeaderboardTab = 'followers' | 'likers' | 'commenters' | 'referrers';

const LEADERBOARD_TABS: { key: LeaderboardTab; label: string; unit: string }[] = [
  { key: 'followers', label: 'Followers', unit: 'followers' },
  { key: 'likers', label: 'Likers', unit: 'likes' },
  { key: 'commenters', label: 'Commenters', unit: 'comments' },
  // Referrers tab hidden for now (user order 2026-10-16) — re-enable by uncommenting:
  // { key: 'referrers', label: 'Referrers', unit: 'referrals' },
];

function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4a1 1 0 0 0-1 1c0 2.5 2 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.5-2 4-4 4" />
    </svg>
  );
}

export default function MonetizationPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [earnings, setEarnings] = useState<{ earnings: Earning[]; total: number } | null>(null);
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [allowed, setAllowed] = useState<Record<string, { code: string; label: string; fields: any }[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ methodType: '', accountName: '', accountNumber: '', extra: '' });
  const [saving, setSaving] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('followers');
  const [boards, setBoards] = useState<Partial<Record<LeaderboardTab, LeaderboardEntry[]>>>({});
  const [boardLoading, setBoardLoading] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    Promise.all([fetchDashboard(), fetchPayoutMethods(), fetchEarnings()])
      .then(([dResult, mResult, eResult]) => {
        if (dResult.success) setData(dResult.data?.monetization ?? null);
        else { setError(true); return; }
        if (mResult.success) {
          setMethods(mResult.data.methods || []);
          setAllowed(mResult.data.allowed || {});
          setUserCountry(mResult.data.country || null);
        }
        if (eResult.success) setEarnings(eResult.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function loadBoard(tab: LeaderboardTab) {
    if (boards[tab]) return;
    setBoardLoading(true);
    fetchLeaderboard(tab, 10)
      .then((r) => {
        if (r.success) setBoards((prev) => ({ ...prev, [tab]: r.data?.leaderboard ?? [] }));
      })
      .catch(() => {})
      .finally(() => setBoardLoading(false));
  }

  useEffect(() => { loadBoard(activeTab); }, [activeTab]);

  function handleCopy() {
    if (!data?.referralLink) return;
    navigator.clipboard?.writeText(data.referralLink).then(
      () => setToast({ message: 'Referral link copied.', type: 'success' }),
      () => setToast({ message: 'Could not copy link.', type: 'error' }),
    );
  }

  async function handleAddMethod() {
    if (!form.methodType || !form.accountName.trim() || !form.accountNumber.trim() || saving) return;
    setSaving(true);
    try {
      const result = await addPayoutMethod({
        methodType: form.methodType,
        accountName: form.accountName.trim(),
        accountNumber: form.accountNumber.trim(),
        extra: form.extra.trim() || undefined,
      });
      if (result.success) {
        setMethods((prev) => [result.data.method, ...prev.map((m) => ({ ...m, isDefault: result.data.method.isDefault ? false : m.isDefault }))]);
        setShowAdd(false);
        setForm({ methodType: '', accountName: '', accountNumber: '', extra: '' });
        setToast({ message: 'Payout method added.', type: 'success' });
      } else {
        setToast({ message: result.error?.message || 'Could not add payout method.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Could not add payout method.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await deletePayoutMethod(id);
    if (result.success) {
      setMethods((prev) => prev.filter((m) => m.id !== id));
      setToast({ message: 'Payout method removed.', type: 'success' });
    }
  }

  async function handleSetDefault(id: string) {
    const result = await setDefaultPayoutMethod(id);
    if (result.success) {
      setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
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
  const referrals = data?.referrals ?? 0;
  const progress = data?.progress ?? 0;
  const eligible = data?.status === 'eligible';
  const earningRate = data?.earningPerReferral ?? 0.1;
  const countryMethods = userCountry ? (allowed[userCountry] || []) : [];
  const selectedMethod = countryMethods.find((m) => m.code === form.methodType);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-slate-700"><MonetizationIcon /></span>
        <h1 className="text-xl font-semibold">Monetization</h1>
      </div>

      <div className="mb-3 rounded-lg border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Earnings</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">${(earnings?.total ?? 0).toFixed(2)}</p>
            <p className="mt-1 text-xs text-slate-500">${earningRate.toFixed(2)} per referral after the first {requiredReferrals}</p>
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

        {earnings && earnings.earnings.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-medium text-slate-500">Recent earnings</p>
            <div className="space-y-1.5">
              {earnings.earnings.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Referral · {new Date(e.createdAt).toLocaleDateString()}</span>
                  <span className="font-semibold text-emerald-600">+${e.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-3 rounded-lg border bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Your referral link</p>
        <p className="mt-1 text-xs text-slate-500">
          Share this link. First {requiredReferrals} referrals unlock payouts, then you earn ${earningRate.toFixed(2)} per referral.
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
            onClick={handleCopy}
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="text-amber-500"><TrophyIcon /></span>
          <p className="text-sm font-semibold text-slate-900">Leaderboard</p>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto">
          {LEADERBOARD_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                activeTab === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-3">
          {boardLoading && !boards[activeTab] ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (boards[activeTab] ?? []).length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">No rankings yet — be the first!</p>
          ) : (
            <div className="space-y-1">
              {(boards[activeTab] ?? []).map((e) => (
                <a
                  key={e.username}
                  href={`/u/${e.username}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <span
                    className={`w-6 text-center text-sm font-bold ${
                      e.rank === 1 ? 'text-amber-500' : e.rank === 2 ? 'text-slate-400' : e.rank === 3 ? 'text-amber-700' : 'text-slate-400'
                    }`}
                  >
                    {e.rank}
                  </span>
                  {e.avatar ? (
                    <img src={e.avatar} alt={e.username} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">
                      {e.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      @{e.username}
                      {e.isVerified && <span className="ml-1 text-blue-500">✓</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">{e.displayName || ''}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {e.count.toLocaleString()} {LEADERBOARD_TABS.find((t) => t.key === activeTab)?.unit}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Payout methods</p>
          <button onClick={() => setShowAdd(true)} className="text-xs font-medium text-blue-600">+ Add</button>
        </div>
        {methods.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No payout method added yet. Add one to receive your earnings.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {m.methodLabel} {m.isDefault && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Default</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">{m.accountName} · {m.accountNumber}{m.extra ? ` · ${m.extra}` : ''}</p>
                </div>
                {!m.isDefault && (
                  <button onClick={() => handleSetDefault(m.id)} className="text-xs text-blue-600">Set default</button>
                )}
                <button onClick={() => handleDelete(m.id)} className="text-xs text-red-600">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-base font-semibold">Add payout method</h3>
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
              onClick={handleAddMethod}
              disabled={saving || !userCountry || !form.methodType || !form.accountName.trim() || !form.accountNumber.trim()}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add payout method'}
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
