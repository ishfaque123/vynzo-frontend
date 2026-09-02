'use client';

import { useEffect, useState } from 'react';
import { fetchMe } from '@/lib/api/authApi';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe().then((result) => {
      setUser(result.success ? result.data.user : null);
      setLoading(false);
    });
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
