'use client';

import Link from 'next/link';
import { recordBoostClick } from '@/lib/api/boostApi';

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

/** Small globe (world) icon — the "Ad" label's icon (owner, 2026-11-25). */
export function GlobeIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

/** "Ad" label with a globe icon (owner, 2026-11-25: boosted content reads "Ad" with a world icon next to the timestamp, like the approved example "5d · 🌐 Ad" — replaces the blue "Sponsored" pill). Grey on a light background; white with a soft shadow when overlaid on a video. */
export function BoostedBadge({ overlay = false }: { overlay?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] font-medium ${overlay ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]' : 'text-slate-500'}`}
    >
      <GlobeIcon size={12} />
      Ad
    </span>
  );
}

/** The call-to-action a live boost puts on its content (Boost v2).
 *  Owner rule (2026-11-18): ONLY a Business Promotion boost shows a
 *  button on the content — the user's own link as a button. Views Gain
 *  and Followers Gain boosts show NO button at all; the boosted post
 *  or reel looks completely normal apart from the Boosted badge. (The
 *  API still describes a 'follow' button for Followers Gain — it is
 *  deliberately not rendered.) Call sites gate this like every Boost
 *  visual: in-app only, and never on the viewer's own content. */
export type BoostButtonData =
  | { type: 'follow' }
  | { type: 'link'; url: string; text: string; boostId: string }
  | null;

export function BoostCtaButton({ button }: { button: BoostButtonData }) {
  if (!button || button.type !== 'link') return null;
  return (
    <div className="px-3 pb-2.5">
      <a
        href={button.url}
        target="_blank"
        rel="noreferrer noopener"
        onClick={(e) => {
          e.stopPropagation();
          // Record the click first (fire-and-forget — the link opens in
          // a new tab, so this page stays alive and the request
          // completes; a failure here never blocks the link). The
          // server counts at most one click per viewer per boost per
          // hour and ends the boost when its click cap is reached.
          void recordBoostClick(button.boostId);
        }}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white active:bg-blue-700"
      >
        {button.text}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17L17 7" /><path d="M8 7h9v9" />
        </svg>
      </a>
    </div>
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
