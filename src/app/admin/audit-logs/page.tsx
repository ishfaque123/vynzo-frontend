'use client';

export default function Page() {
  return <div className="space-y-5"><div><h2 className="text-2xl font-bold">Audit Logs</h2><p className="mt-1 text-sm text-slate-500">Review administrative actions and security events.</p></div><div className="rounded-2xl border bg-white p-8 text-center shadow-sm"><h3 className="font-semibold">Audit log management is not connected yet</h3><p className="mt-2 text-sm text-slate-500">The backend currently exposes authentication-failure logs, but no general admin audit-log endpoint. No fake audit records are shown.</p></div></div>;
}