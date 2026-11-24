'use client';

import { useEffect, useState } from 'react';
import { fetchMe } from '@/lib/api/authApi';
import { clearOfflineCache, getOfflineUser, saveOfflineUser } from '@/lib/offline/feedCache';
import { clearAllFeedSnapshots } from '@/lib/offline/feedSnapshot';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  // "verified" only becomes true once the server check (fetchMe) has
  // given a definitive answer in this session: a 200 carrying the user,
  // or a 401 saying the session is over. It must NEVER be set from the
  // cached user, and never after a network failure, timeout or 5xx —
  // those say nothing about whether the login is still valid. The
  // cached user shown below is optimistic and may still belong to a
  // *different* account than the one actually logged in now (e.g. right
  // after switching to a brand-new Google account on this device), and
  // treating a timeout as "verified logged in" is what bounced users
  // between / and /login in the blank-blue-screen bug. Any decision
  // that depends on the confirmed profile (such as redirecting away
  // from profile setup, or /login sending the user back to /) must
  // wait for this, not just for `loading` to become false.
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

    // Fallback for failures that say NOTHING about the session's
    // validity (network error, timeout, 5xx): keep painting the cached
    // user and leave `verified` false — a cached user is not a
    // confirmed login, and nothing is cleared or redirected from here.
    async function fallBackToCachedUser() {
      const cachedUser = await getOfflineUser();
      if (cancelled) return;
      if (cachedUser) {
        setUser(cachedUser);
        setOffline(true);
      } else {
        setUser(null);
        setOffline(false);
      }
    }

    // Definitive 401: the server has ended this session (signed out
    // elsewhere, revoked, or the session record is gone — e.g. the old
    // idle-session cleanup). Purge every local trace of the dead
    // session — the cached user and all feed snapshots — so no later
    // screen can resurrect it, then settle as logged out and settle
    // every other mounted useAuth instance the same way.
    async function settleSessionEnded() {
      await clearOfflineCache();
      clearAllFeedSnapshots();
      if (cancelled) return;
      setUser(null);
      setOffline(false);
      setVerified(true);
      try {
        window.dispatchEvent(new Event('frianzo-logout'));
      } catch {
        // Settling other instances is best-effort.
      }
    }

    fetchMe()
      .then(async (result) => {
        if (cancelled) return;
        if (result.success && result.data?.user) {
          setUser(result.data.user);
          setOffline(false);
          setVerified(true);
          saveOfflineUser(result.data.user).catch(() => {});
          return;
        }
        if (result.status === 401) {
          await settleSessionEnded();
          return;
        }
        // Resolved but neither a user nor a definitive 401 (e.g. a 5xx
        // error body): transient — treat it exactly like a network
        // failure, never as a logout.
        await fallBackToCachedUser();
      })
      .catch(async () => {
        if (cancelled) return;
        await fallBackToCachedUser();
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          // Tell the Android app the auth check is done. The native
          // 6-dots overlay is held until this signal (or its 15s safety
          // timeout); without it the dots would hang until the timeout
          // on every cold launch. The cached-user path above deliberately
          // does NOT signal: it is optimistic, and signalling on it would
          // hide the overlay before the server-verified auth result,
          // reintroducing login->home flicker. Harmless on the web,
          // where window.FrianzoNative is absent.
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
        .then(async (result) => {
          if (result.success && result.data?.user) {
            setUser(result.data.user);
            setOffline(false);
            setVerified(true);
            saveOfflineUser(result.data.user).catch(() => {});
            return;
          }
          if (result.status === 401) {
            // Same definitive-answer rule as the initial check: purge
            // the dead session's local traces and settle as logged out.
            await clearOfflineCache();
            clearAllFeedSnapshots();
            setUser(null);
            setOffline(false);
            setVerified(true);
          }
          // Any other failure says nothing about the session: leave the
          // current state untouched rather than guessing.
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    window.addEventListener('frianzo-account-switched', onAccountSwitched);
    return () => window.removeEventListener('frianzo-account-switched', onAccountSwitched);
  }, []);

  return { user, loading, isAuthenticated: !!user, offline, verified };
}
