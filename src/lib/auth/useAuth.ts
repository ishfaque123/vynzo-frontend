'use client';

import { useEffect, useState } from 'react';
import { fetchMe, savePublicKeyRequest } from '@/lib/api/authApi';
import { getOrCreateIdentity } from '@/lib/crypto/e2ee';
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
          getOrCreateIdentity()
            .then(({ publicKeyJson }) => savePublicKeyRequest(publicKeyJson))
            .catch(() => {});
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
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, isAuthenticated: !!user, offline, verified };
}
