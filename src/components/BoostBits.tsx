'use client';

import Link from 'next/link';

/**
 * Shared Boost UI pieces (web). Boost is visible ONLY inside the old
 * Android app (frianzo-app WebView) — every call site gates rendering
 * on `useInFrianzoApp()` plus own-content + PK checks, so nothing in
 * this file ever reaches a normal browser.
 */

/** Where a Boost tap lands: the Boost page with the item preselected. */
export function boostHref(contentType: 'post' | 'reel', contentId: string): string {
  return `/boost?type=${contentType}&id=${encodeURIComponent(contentId)}`;
}

/** "Boosted" pill, FrianzoBlue (#2563EB = Tailwind blue-600, the
 *  same blue the native badge and the site's primary buttons use). */
export function BoostedBadge({ overlay = false }: { overlay?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white ${overlay ? 'shadow' : ''}`}
    >
      Boosted
    </span>
  );
}

/** The blue "Boost" button (label exactly "Boost"). Rendered by call
 *  sites only when every gate passes (in-app + own content + PK). */
export function BoostButton({ href, className = '' }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-transform duration-100 active:scale-[0.99] active:bg-blue-700 ${className}`}
    >
      Boost
    </Link>
  );
}
