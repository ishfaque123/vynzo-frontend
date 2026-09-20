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
    fetchMe()
      .then((result) => {
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
        setLoading(false);
      });
  }, []);

  return { user, loading, isAuthenticated: !!user, offline };
}
