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

/** "Sponsored" pill (owner, 2026-11-18: the label on boosted content reads Sponsored, like Facebook — never "Boosted"), FrianzoBlue (#2563EB = Tailwind blue-600, the
 *  same blue the native badge and the site's primary buttons use). */
export function BoostedBadge({ overlay = false }: { overlay?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white ${overlay ? 'shadow' : ''}`}
    >
      Sponsored
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
  | { type: 'link'; url: string; text: string }
  | null;

export function BoostCtaButton({ button }: { button: BoostButtonData }) {
  if (!button || button.type !== 'link') return null;
  return (
    <div className="px-3 pb-2.5">
      <a
        href={button.url}
        target="_blank"
        rel="noreferrer noopener"
        onClick={(e) => e.stopPropagation()}
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
