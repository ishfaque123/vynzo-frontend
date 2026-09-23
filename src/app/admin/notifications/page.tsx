'use client';

export default function Page() {
  return <div className="space-y-5"><div><h2 className="text-2xl font-bold">Notifications</h2><p className="mt-1 text-sm text-slate-500">Manage administrative and platform notifications.</p></div><div className="rounded-2xl border bg-white p-8 text-center shadow-sm"><h3 className="font-semibold">Notification management is not connected yet</h3><p className="mt-2 text-sm text-slate-500">The current admin API has no notification-management endpoints. No fake notifications are shown.</p></div></div>;
}