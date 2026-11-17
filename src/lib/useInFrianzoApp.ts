'use client';

import { useEffect, useState } from 'react';

/**
 * In-app detection for the OLD Android app (frianzo-app, the Play Store
 * WebView wrapper). The app injects a JavaScript bridge object named
 * `FrianzoNative` into every page it loads
 * (frianzo-app MainActivity: `webView.addJavascriptInterface(
 * NativeBridge(), "FrianzoNative")`), so its presence is the site's
 * established in-app marker — the same check AdUnit, HomeClient,
 * NativeRedirect, Shell and PushRegistrar already use.
 *
 * Both hooks start at `false` / unchecked on the server and on first
 * paint, so app-only UI NEVER renders in a normal browser — not even
 * for one frame. Inside the app the bridge is injected before the page
 * loads, so the first effect pass confirms it immediately.
 */

/** True only once the client check has confirmed the app WebView. */
export function useInFrianzoApp(): boolean {
  const [inApp, setInApp] = useState(false);
  useEffect(() => {
    setInApp(!!(window as any).FrianzoNative);
  }, []);
  return inApp;
}

/** Same check, but also reports whether the check has run yet — for
 *  routes that must render nothing until the answer is known and then
 *  redirect away when the visitor is in a normal browser. */
export function useInFrianzoAppChecked(): { checked: boolean; inApp: boolean } {
  const [state, setState] = useState<{ checked: boolean; inApp: boolean }>({ checked: false, inApp: false });
  useEffect(() => {
    setState({ checked: true, inApp: !!(window as any).FrianzoNative });
  }, []);
  return state;
}
