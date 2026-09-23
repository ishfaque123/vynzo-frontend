'use client';

export default function Page() {
  return <div className="space-y-5"><div><h2 className="text-2xl font-bold">Comments</h2><p className="mt-1 text-sm text-slate-500">Review and manage comments across the platform.</p></div><div className="rounded-2xl border bg-white p-8 text-center shadow-sm"><h3 className="font-semibold">Comments management is not connected yet</h3><p className="mt-2 text-sm text-slate-500">The backend currently exposes comment deletion, but it does not yet expose a paginated admin comments list. No fake comments are shown.</p></div></div>;
}