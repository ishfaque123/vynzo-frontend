'use client';

import { useEffect, useState } from 'react';
import { fetchMe, savePublicKeyRequest } from '@/lib/api/authApi';
import { getOrCreateIdentity } from '@/lib/crypto/e2ee';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then((result) => {
        const loggedInUser = result.success ? result.data.user : null;
        setUser(loggedInUser);
        if (loggedInUser) {
          // Make sure this device has an E2EE identity and the server has
          // its current public key on file, so other people can message
          // this user securely. Safe to call on every load.
          getOrCreateIdentity()
            .then(({ publicKeyJson }) => savePublicKeyRequest(publicKeyJson))
            .catch(() => {});
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
