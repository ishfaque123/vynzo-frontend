'use client';

import { useRouter } from 'next/navigation';
import StrikesSection from '@/components/dashboard/StrikesSection';

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export default function AccountStatusPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="flex items-center gap-1 px-1 py-1">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="rounded-full p-2 text-slate-700">
          <BackIcon />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Account Status</h1>
      </div>

      <div className="mt-3">
        <StrikesSection />
      </div>
    </div>
  );
}
