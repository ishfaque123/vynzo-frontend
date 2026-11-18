'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toggleFollow } from '@/lib/api/userApi';
import { useFollowStatus } from '@/contexts/FollowContext';

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

/** The call-to-action a live boost puts on its content (Boost v2),
 *  exactly as the API's `boostButton` field describes it: a Follow
 *  button for a Followers Gain boost, the user's own link as a button
 *  for a Business Promotion boost with a link, and nothing for a Views
 *  Gain boost. Call sites gate it like every Boost visual: in-app only,
 *  and never on the viewer's own content. */
export type BoostButtonData =
  | { type: 'follow' }
  | { type: 'link'; url: string; text: string }
  | null;

export function BoostCtaButton({
  button,
  authorId,
  friendStatus,
}: {
  button: BoostButtonData;
  authorId: string;
  friendStatus?: string | null;
}) {
  if (!button) return null;
  if (button.type === 'link') {
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
  return <BoostFollowCta authorId={authorId} initialStatus={friendStatus || 'none'} />;
}

/** Blue Follow button for a Followers Gain boost. Uses the same follow
 *  state store and toggle endpoint as the regular FollowButton, so the
 *  two buttons never disagree; hides itself for the author ('self')
 *  and for friends, exactly like FollowButton does. */
function BoostFollowCta({ authorId, initialStatus }: { authorId: string; initialStatus: string }) {
  const { status, setStatus } = useFollowStatus(authorId, initialStatus);
  const [loading, setLoading] = useState(false);

  if (status === 'self' || status === 'friends') return null;

  async function handleClick() {
    setLoading(true);
    const result = await toggleFollow(authorId);
    setLoading(false);
    if (result.success) {
      if (result.data.following) {
        setStatus(status === 'follow_back' ? 'friends' : 'following');
      } else {
        setStatus('none');
      }
    } else if (result.error?.code === 'FRIEND_LIMIT_REACHED') {
      alert('Friend limit of 5,000 reached.');
    }
  }

  const label = status === 'following' ? 'Following' : status === 'follow_back' ? 'Follow Back' : 'Follow';
  return (
    <div className="flex justify-end px-3 pb-2.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleClick();
        }}
        disabled={loading}
        className={`rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50 ${
          status === 'following' ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white active:bg-blue-700'
        }`}
      >
        {label}
      </button>
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
