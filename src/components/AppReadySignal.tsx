'use client';

import { useEffect } from 'react';

/**
 * Tells the native app shell that React has mounted and the page is
 * actually interactive. The shell's first-load gate polls the DOM via
 * evaluateJavascript and keeps its loading overlay up until this
 * signal is set, so a page that only looks ready — HTML painted while
 * its JS bundle is still downloading on a slow connection — never
 * exposes buttons that are still dead. Renders nothing and is
 * harmless in a normal browser.
 */
export default function AppReadySignal() {
  useEffect(() => {
    document.documentElement.setAttribute('data-frianzo-ready', '1');
    (window as unknown as { __FRIANZO_READY__?: boolean }).__FRIANZO_READY__ =
      true;
  }, []);

  return null;
}
