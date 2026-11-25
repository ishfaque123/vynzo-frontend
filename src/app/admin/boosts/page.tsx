'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAdminBoostRequests, reviewAdminBoostRequest } from '@/lib/api/adminApi';

type BoostRequestItem = {
  id: string;
  contentType: 'post' | 'reel';
  purpose: string;
  planDays: number;
  amountPkr: number;
  dailyBudget?: number | null;
  linkUrl?: string | null;
  buttonText?: string | null;
  linkClicks?: number;
  clickCap?: number | null;
  paymentMethod: string;
  transactionId?: string | null;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  adminNote?: string | null;
  reviewedAt?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    username?: string | null;
    displayName?: string | null;
    email?: string | null;
    profilePictureUrl?: string | null;
    country?: string | null;
  };
  post: {
    id: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
  } | null;
  reel: {
    id: string;
    caption?: string | null;
    thumbnailUrl?: string | null;
    videoUrl: string;
    createdAt: string;
  } | null;
};

const PURPOSE_LABELS: Record<string, string> = {
  followers_gain: 'Followers Gain',
  views_gain: 'Views Gain',
  clicks: 'Clicks',
  // Legacy rows only — Business Promotion can no longer be created
  // (owner decision 2026-11-25), but old boosts keep their label.
  business_promotion: 'Business Promotion',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
  expired: 'bg-slate-100 text-slate-500',
};

export default function BoostsPage() {
  const [requests, setRequests] = useState<BoostRequestItem[]>([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ page: number; pages: number; total: number } | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    const result = await fetchAdminBoostRequests({ status, search: search.trim(), page });
    if (result.success) {
      setRequests(result.data.requests || []);
      setPagination(result.data.pagination || null);
    } else {
      setError(result.error?.message || 'Could not load boost requests.');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [status, page]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  async function review(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    setError('');
    const result = await reviewAdminBoostRequest(id, action, note[id]);
    if (result.success) {
      setRequests((prev) => prev.filter((item) => item.id !== id));
      setNote((prev) => ({ ...prev, [id]: '' }));
    } else {
      setError(result.error?.message || 'Could not review this boost request.');
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Boost Requests</h2>
        <p className="mt-1 text-sm text-slate-500">Review paid boosts for posts and reels. Approving starts the boost immediately for its chosen days.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm md:flex-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search username, name, email, transaction ID, post text or reel caption" className="flex-1 rounded-xl border px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
          <option value="">All</option>
        </select>
        <button onClick={() => { setPage(1); load(); }} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Search</button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-sm">
          <span className="text-slate-500">Page {pagination.page} of {pagination.pages} · {pagination.total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border px-3 py-1.5 font-medium text-slate-700 disabled:opacity-40">Previous</button>
            <button disabled={page >= pagination.pages} onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} className="rounded-lg border px-3 py-1.5 font-medium text-slate-700 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Loading boost requests...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">No boost requests found.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-200">
                    {item.user.profilePictureUrl ? <img src={item.user.profilePictureUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-semibold text-slate-500">{(item.user.displayName || item.user.username || '?')[0].toUpperCase()}</div>}
                  </div>
                  <div>
                    <p className="font-semibold">{item.user.displayName || item.user.username || 'Unknown user'}</p>
                    <p className="text-sm text-slate-500">@{item.user.username || 'unknown'}{item.user.email ? ` · ${item.user.email}` : ''}{item.user.country ? ` · ${item.user.country}` : ''}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[item.status] || 'bg-slate-100 text-slate-500'}`}>{item.status}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plan</p><p className="mt-1 font-semibold text-slate-800">{item.planDays} day{item.planDays > 1 ? 's' : ''}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Daily Budget</p><p className="mt-1 font-semibold text-slate-800">{item.dailyBudget ? `Rs ${item.dailyBudget}` : '—'}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Amount</p><p className="mt-1 font-semibold text-slate-800">Rs {item.amountPkr}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Method</p><p className="mt-1 font-semibold capitalize text-slate-800">{item.paymentMethod}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Purpose</p><p className="mt-1 font-semibold text-slate-800">{PURPOSE_LABELS[item.purpose] || item.purpose}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Transaction ID</p><p className="mt-1 break-all font-semibold text-slate-800">{item.transactionId || '—'}</p></div>
              </div>

              {item.linkUrl && (
                <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Boost Link Button</p>
                  <p className="mt-1 font-semibold text-slate-800">{item.buttonText || 'Learn More'}</p>
                  <a href={item.linkUrl} target="_blank" rel="noreferrer" className="mt-0.5 block break-all text-blue-600 hover:underline">{item.linkUrl}</a>
                  {item.clickCap ? (
                    <p className="mt-1.5 font-semibold text-slate-800">Link clicks: {item.linkClicks ?? 0} / {item.clickCap}</p>
                  ) : null}
                </div>
              )}

              {item.contentType === 'reel' && item.reel ? (
                <div className="mt-3 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reel</p>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">{item.reel.caption || '(no caption)'}</p>
                  {item.reel.thumbnailUrl && <img src={item.reel.thumbnailUrl} alt="" className="mt-2 max-h-40 rounded-lg object-cover" />}
                  <Link href={`/reels?id=${item.reel.id}`} className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline">Open reel</Link>
                </div>
              ) : item.post ? (
                <div className="mt-3 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Post</p>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">{item.post.content || '(no text)'}</p>
                  {item.post.imageUrl && <img src={item.post.imageUrl} alt="" className="mt-2 max-h-40 rounded-lg object-cover" />}
                  <Link href={`/post/${item.post.id}`} className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline">Open post</Link>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a href={item.screenshotUrl} target="_blank" rel="noreferrer" className="rounded-xl border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">View payment screenshot</a>
                {item.status === 'approved' && item.startsAt && item.endsAt && (
                  <p className="text-xs text-slate-500">Boost runs {new Date(item.startsAt).toLocaleString()} → {new Date(item.endsAt).toLocaleString()}</p>
                )}
              </div>

              {item.status === 'pending' && (
                <>
                  <textarea value={note[item.id] || ''} onChange={(e) => setNote((prev) => ({ ...prev, [item.id]: e.target.value }))} maxLength={1000} placeholder="Optional admin note" className="mt-3 w-full rounded-xl border px-3 py-2 text-sm" rows={2} />
                  <div className="mt-3 flex gap-2">
                    <button disabled={busyId === item.id} onClick={() => review(item.id, 'approve')} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Approve & Start Boost</button>
                    <button disabled={busyId === item.id} onClick={() => review(item.id, 'reject')} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50">Reject</button>
                  </div>
                </>
              )}

              {item.adminNote && <p className="mt-3 text-sm text-slate-500">Admin note: {item.adminNote}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
