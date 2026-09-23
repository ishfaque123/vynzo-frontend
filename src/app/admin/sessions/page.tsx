'use client';

export default function Page() {
  return <div className="space-y-5"><div><h2 className="text-2xl font-bold">Sessions & Devices</h2><p className="mt-1 text-sm text-slate-500">Inspect account sessions and device activity.</p></div><div className="rounded-2xl border bg-white p-8 text-center shadow-sm"><h3 className="font-semibold">Session management is not connected yet</h3><p className="mt-2 text-sm text-slate-500">The admin API currently has no sessions/devices listing endpoint. No fake device or session records are shown.</p></div></div>;
}