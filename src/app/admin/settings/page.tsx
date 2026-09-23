'use client';

export default function Page() {
  return <div className="space-y-5"><div><h2 className="text-2xl font-bold">Settings</h2><p className="mt-1 text-sm text-slate-500">Manage administrator and platform settings.</p></div><div className="rounded-2xl border bg-white p-8 text-center shadow-sm"><h3 className="font-semibold">Admin settings are not connected yet</h3><p className="mt-2 text-sm text-slate-500">The current backend does not expose an admin settings API. No settings are changed from this page.</p></div></div>;
}