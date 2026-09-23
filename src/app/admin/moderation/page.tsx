'use client';

export default function Page() {
  return <div className="space-y-5"><div><h2 className="text-2xl font-bold">Moderation</h2><p className="mt-1 text-sm text-slate-500">Central moderation controls for platform content.</p></div><div className="rounded-2xl border bg-white p-8 text-center shadow-sm"><h3 className="font-semibold">Moderation tools are not connected yet</h3><p className="mt-2 text-sm text-slate-500">The current backend does not expose a dedicated moderation queue or moderation-history API. No fake moderation data is shown.</p></div></div>;
}