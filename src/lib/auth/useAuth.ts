'use client';

import { useEffect, useState } from 'react';
import { fetchMe } from '@/lib/api/authApi';
import { getOfflineUser, saveOfflineUser } from '@/lib/offline/feedCache';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  // "verified" only becomes true once the real server check (fetchMe) has
  // resolved. The cached user shown below is optimistic and may still
  // belong to a *different* account than the one actually logged in now
  // (e.g. right after switching to a brand-new Google account on this
  // device) - any decision that depends on the confirmed profile (such as
  // redirecting away from profile setup) must wait for this, not just for
  // `loading` to become false.
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getOfflineUser()
      .then((cachedUser) => {
        if (cancelled || !cachedUser) return;
        setUser(cachedUser);
        setLoading(false);
      })
      .catch(() => {});

    fetchMe()
      .then((result) => {
        if (cancelled) return;
        const loggedInUser = result.success ? result.data.user : null;
        setUser(loggedInUser);
        setOffline(false);
        setVerified(true);
        if (loggedInUser) {
          saveOfflineUser(loggedInUser).catch(() => {});
        }
      })
      .catch(async () => {
        if (cancelled) return;
        const cachedUser = await getOfflineUser();
        if (cachedUser) {
          setUser(cachedUser);
          setOffline(true);
        } else {
          setUser(null);
          setOffline(false);
        }
        setVerified(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          // Smooth-loading: tell the Android app the auth check is done.
          // The native overlay is held until this signal (or its 15s
          // safety timeout), so the user sees one continuous loading
          // screen instead of dots -> ring -> login/feed. The cached-user
          // path above deliberately does NOT signal: it is optimistic,
          // and signalling on it would hide the overlay before the
          // server-verified auth result, reintroducing login->home flicker.
          // Harmless on the web, where window.FrianzoNative is absent.
          try {
            const bridge = (window as any).FrianzoNative;
            if (bridge?.notifyAuthReady) bridge.notifyAuthReady();
          } catch {
            // Bridge unavailable (web browser) — ignore.
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // The app broadcasts 'frianzo-logout' right after a successful logout /
  // account deletion (see authApi). Every mounted instance must drop its
  // (now stale) user immediately, so a following client-side navigation
  // never renders logged-in UI for a logged-out session.
  useEffect(() => {
    function onLoggedOut() {
      setUser(null);
      setOffline(false);
      setVerified(true);
      setLoading(false);
    }
    window.addEventListener('frianzo-logout', onLoggedOut);
    return () => window.removeEventListener('frianzo-logout', onLoggedOut);
  }, []);

  // The app broadcasts 'frianzo-account-switched' right after a successful
  // account switch (see authApi). Every mounted instance must reload the
  // current user, so a following client-side navigation never renders the
  // previous account's UI.
  useEffect(() => {
    function onAccountSwitched() {
      setLoading(true);
      fetchMe()
        .then((result) => {
          const u = result.success ? result.data.user : null;
          setUser(u);
          setOffline(false);
          setVerified(true);
          if (u) {
            saveOfflineUser(u).catch(() => {});
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    window.addEventListener('frianzo-account-switched', onAccountSwitched);
    return () => window.removeEventListener('frianzo-account-switched', onAccountSwitched);
  }, []);

  return { user, loading, isAuthenticated: !!user, offline, verified };
}
