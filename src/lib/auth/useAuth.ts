'use client';

import { useEffect, useState } from 'react';
import { fetchMe, savePublicKeyRequest } from '@/lib/api/authApi';
import { getOrCreateIdentity } from '@/lib/crypto/e2ee';
import { getOfflineUser, saveOfflineUser } from '@/lib/offline/feedCache';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Show the last known user immediately if we have one cached, so a
    // reload doesn't blank the whole screen back to the splash logo while
    // we revalidate the session in the background (same "show stale, then
    // refresh" feel apps like Facebook use).
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
        if (loggedInUser) {
          saveOfflineUser(loggedInUser).catch(() => {});
          // Make sure this device has an E2EE identity and the server has
          // its current public key on file, so other people can message
          // this user securely. Safe to call on every load.
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
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, isAuthenticated: !!user, offline };
}
