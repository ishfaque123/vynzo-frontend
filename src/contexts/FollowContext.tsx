'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type FollowStatusMap = Record<string, string>;

const FollowContext = createContext<{
  overrides: FollowStatusMap;
  setStatus: (userId: string, status: string) => void;
} | null>(null);

export function FollowProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<FollowStatusMap>({});
  const setStatus = useCallback((userId: string, status: string) => {
    setOverrides((prev) => ({ ...prev, [userId]: status }));
  }, []);
  return (
    <FollowContext.Provider value={{ overrides, setStatus }}>
      {children}
    </FollowContext.Provider>
  );
}

export function useFollowStatus(userId: string, initialStatus: string) {
  const ctx = useContext(FollowContext);
  if (!ctx) return { status: initialStatus, setStatus: () => {} };
  const status = ctx.overrides[userId] ?? initialStatus;
  const setStatus = (s: string) => ctx.setStatus(userId, s);
  return { status, setStatus };
}
