'use client';

import { useEffect } from 'react';
import { pingUsage } from '@/lib/api/usageApi';

const PING_INTERVAL_MS = 60000;

export default function UsageTracker() {
  useEffect(() => {
    function tick() {
      if (document.visibilityState === 'visible') pingUsage();
    }
    tick();
    const interval = setInterval(tick, PING_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  return null;
}
