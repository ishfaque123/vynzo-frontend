'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function ToolRow({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl bg-[#f0f2f5] px-4 py-3.5 text-slate-900 dark:bg-[#333436]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">{children}</span>
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      <span className="text-slate-400">›</span>
    </Link>
  );
}

export default function ToolsPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="flex items-center gap-1 px-1 py-1">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="rounded-full p-2 text-slate-700">
          <BackIcon />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Other Tools</h1>
      </div>

      <div className="mt-3 space-y-2">
        <ToolRow href="/boost/my" label="Ads Manager">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none" />
          </svg>
        </ToolRow>
        <ToolRow href="/settings-menu/monetization" label="Monetization">
          <span className="text-lg font-bold">$</span>
        </ToolRow>
        <ToolRow href="/settings-menu/monetization#referrals" label="Referrals">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c.6-3.2 3.2-5 6.5-5s5.9 1.8 6.5 5" />
            <path d="M16 5.2a3.5 3.5 0 010 6.3M18.6 15.3c1.6.9 2.6 2.4 2.9 4.7" />
          </svg>
        </ToolRow>
        <ToolRow href="/leaderboard" label="Leaderboard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 20v-6M11 20V6M17 20v-9" />
            <path d="M3 20h18" />
          </svg>
        </ToolRow>
        <ToolRow href="/account-status" label="Account Status">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l7 2.8v5.4c0 4.4-2.9 8.1-7 9.8-4.1-1.7-7-5.4-7-9.8V5.8z" />
            <path d="M9 11.8l2.2 2.2 4-4.2" />
          </svg>
        </ToolRow>
        <ToolRow href="/achievements" label="Achievements">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 21h8M12 17.5V21M7 4h10v4.5a5 5 0 01-10 0z" />
            <path d="M7 5.5H4.2A2.7 2.7 0 007 10M17 5.5h2.8A2.7 2.7 0 0117 10" />
          </svg>
        </ToolRow>
        <ToolRow href="/weekly-goals" label="Weekly Goals">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          </svg>
        </ToolRow>
      </div>
    </div>
  );
}
