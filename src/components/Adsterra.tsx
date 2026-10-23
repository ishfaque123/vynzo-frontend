'use client';

/**
 * Adsterra ad slots (SEPARATE from Google AdSense — see AdUnit.tsx and the
 * AdSense loader in src/app/layout.tsx, which are untouched by this file).
 *
 * Every slot is driven by src/lib/adsterraSnippets.ts. While a unit's
 * snippet constant is empty, its slot renders null — no DOM node, no empty
 * box, no layout shift. Once the real Adsterra code is pasted into the
 * constant, the slot injects it and re-creates any <script> tags (scripts
 * set via innerHTML never execute on their own, so they are cloned into
 * fresh elements the browser will run).
 *
 * Placement policy (hard rule): public pages (landing, /blog, /about,
 * /help) plus — by the owner's explicit orders on 2026-10-23, because most
 * users live there — the logged-in home feed (300x250 banner), the /reels
 * page (320x50 banner), and profile pages /u/[username] (one 300x250
 * banner below the header/bio). NEVER import these components into
 * chat/DM/messaging screens, admin, settings, or auth screens. The
 * Social Bar additionally enforces its route allowlist itself (see
 * AdsterraSocialBar below).
 */

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ADSTERRA_SNIPPETS } from '@/lib/adsterraSnippets';

function AdsterraSlot({
  snippet,
  placementId,
  className,
}: {
  snippet: string;
  placementId: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hasCode = snippet.trim().length > 0;

  useEffect(() => {
    if (!hasCode || !ref.current) return;
    const el = ref.current;
    el.innerHTML = snippet;
    // Scripts inserted via innerHTML are inert — replace each with a fresh
    // element (same attributes and body) so the browser executes it.
    el.querySelectorAll('script').forEach((old) => {
      const fresh = document.createElement('script');
      Array.from(old.attributes).forEach((attr) =>
        fresh.setAttribute(attr.name, attr.value),
      );
      fresh.textContent = old.textContent;
      old.replaceWith(fresh);
    });
  }, [snippet, hasCode]);

  if (!hasCode) return null;

  return (
    <div
      ref={ref}
      data-adsterra-placement={placementId}
      className={className ?? 'flex justify-center'}
    />
  );
}

const BANNERS = {
  '728x90': { snippet: ADSTERRA_SNIPPETS.banner728x90, placementId: '31872375' },
  '300x250': { snippet: ADSTERRA_SNIPPETS.banner300x250, placementId: '31872376' },
  '320x50': { snippet: ADSTERRA_SNIPPETS.banner320x50, placementId: '31872377' },
} as const;

/** Reusable banner slot for the three approved banner sizes. */
export function AdsterraBanner({
  size,
  className,
}: {
  size: keyof typeof BANNERS;
  className?: string;
}) {
  const banner = BANNERS[size];
  return (
    <AdsterraSlot
      snippet={banner.snippet}
      placementId={banner.placementId}
      className={className}
    />
  );
}

/**
 * Client-side media-query state: null until the width has been measured
 * after mount (SSR / first paint), then true/false. Lets a slot pick its
 * size BEFORE anything is injected, so the wrong-sized iframe never loads.
 */
function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Responsive leaderboard — used on the landing page and the blog index.
 * The 728x90 iframe overflows phone screens, so on viewports narrower
 * than 768px this serves the 320x50 unit instead; on desktop (>=768px) it
 * renders exactly the 728x90 slot. Only ONE slot is ever mounted: the size
 * is chosen from matchMedia before injection (no CSS-hidden second iframe),
 * and while the width is still unknown the slot renders nothing. If the
 * viewport crosses the breakpoint, the mounted slot swaps to the other
 * size (the old node unmounts, the new one injects).
 */
export function AdsterraResponsiveLeaderboard({
  className,
}: {
  className?: string;
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  if (isDesktop === null) return null;
  return isDesktop ? (
    <AdsterraBanner size="728x90" className={className} />
  ) : (
    <AdsterraBanner size="320x50" className={className} />
  );
}

/** Native Banner slot (placement 31872373) — used on blog article pages. */
export function AdsterraNative({ className }: { className?: string }) {
  return (
    <AdsterraSlot
      snippet={ADSTERRA_SNIPPETS.nativeBanner}
      placementId="31872373"
      className={className}
    />
  );
}

/**
 * Routes where the Social Bar may ever appear: the public pages, the home
 * route '/' (which is also the logged-in feed — the owner's call), and the
 * reels feed '/reels' exactly (owner's order, 2026-10-23). Everything else
 * — /messages, /settings*, /admin, /compose, /reels/new, /reels/camera,
 * profiles, etc. — is excluded, so the bar can never load on chat/DM or
 * other app screens.
 */
const SOCIAL_BAR_PUBLIC_PATHS = ['/', '/about', '/help', '/reels'];

function isSocialBarPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    SOCIAL_BAR_PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/blog')
  );
}

/**
 * Social Bar slot (placement 31872374), mounted once in the root layout.
 * Renders nothing unless (a) the current route is a public page and
 * (b) the real snippet has been pasted into ADSTERRA_SNIPPETS.socialBar.
 */
export function AdsterraSocialBar() {
  const pathname = usePathname();
  if (!isSocialBarPath(pathname)) return null;
  return (
    <AdsterraSlot
      snippet={ADSTERRA_SNIPPETS.socialBar}
      placementId="31872374"
    />
  );
}
