'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutRequest } from '@/lib/api/authApi';

function SwitchIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

export default function SwitchAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSwitch() {
    setLoading(true);
    await logoutRequest();
    router.push('/login?switch=1');
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <SwitchIcon />
      </div>
      <h1 className="mb-2 text-lg font-semibold">Switch account</h1>
      <p className="mb-6 text-sm text-slate-500">
        Log out of this account and sign in with a different Google account.
      </p>
      <button onClick={handleSwitch} disabled={loading} className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white disabled:opacity-50">
        {loading ? 'Switching...' : 'Switch account'}
      </button>
    </div>
  );
}
