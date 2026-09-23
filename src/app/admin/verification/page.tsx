'use client';

import { useEffect, useState } from 'react';
import { fetchAdminVerificationRequests, reviewAdminVerificationRequest } from '@/lib/api/adminApi';

type RequestItem = {
  id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    username?: string | null;
    displayName?: string | null;
    email?: string | null;
    profilePictureUrl?: string | null;
    isVerified: boolean;
  };
};

export default function VerificationPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const result = await fetchAdminVerificationRequests({ status, search: search.trim() });
    if (result.success) setRequests(result.data.requests || []);
    else setError(result.error?.message || 'Could not load verification requests.');
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [status]);

  async function review(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    setError('');
    const result = await reviewAdminVerificationRequest(id, action, note[id]);
    if (result.success) {
      setRequests((prev) => prev.filter((item) => item.id !== id));
      setNote((prev) => ({ ...prev, [id]: '' }));
    } else {
      setError(result.error?.message || 'Could not review this request.');
    }
    setBusyId(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Verification Requests</h2>
        <p className="mt-1 text-sm text-slate-500">Review real user requests for the Blue Tick.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm md:flex-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search username, name, email or reason" className="flex-1 rounded-xl border px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
        <button onClick={load} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Search</button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Loading verification requests...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">No verification requests found.</div>
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
                    <p className="text-sm text-slate-500">@{item.user.username || 'unknown'}{item.user.email ? ` · ${item.user.email}` : ''}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-700">{item.status}</span>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.reason}</p>
              </div>

              {item.status === 'pending' && (
                <>
                  <textarea value={note[item.id] || ''} onChange={(e) => setNote((prev) => ({ ...prev, [item.id]: e.target.value }))} maxLength={1000} placeholder="Optional admin note" className="mt-3 w-full rounded-xl border px-3 py-2 text-sm" rows={2} />
                  <div className="mt-3 flex gap-2">
                    <button disabled={busyId === item.id} onClick={() => review(item.id, 'approve')} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Approve & Give Blue Tick</button>
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
