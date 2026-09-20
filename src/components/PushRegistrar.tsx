'use client';

import { useEffect } from 'react';
import { registerPushToken } from '@/lib/api/notificationApi';

declare global {
  interface Window {
    FrianzoNative?: { getPushToken?: () => string };
  }
}

// Inside the Android app, the native side exposes the FCM token.
// Register it with the backend for the logged-in user.
export default function PushRegistrar() {
  useEffect(() => {
    let last = '';
    function tryRegister() {
      try {
        const token = window.FrianzoNative?.getPushToken?.();
        if (!token || token === last) return;
        last = token;
        registerPushToken(token)
          .then((r) => { if (!r?.success) last = ''; })
          .catch(() => { last = ''; });
      } catch {
        // not running inside the app
      }
    }
    tryRegister();
    window.addEventListener('frianzo-push-token', tryRegister);
    const timers = [2000, 6000, 15000].map((ms) => setTimeout(tryRegister, ms));
    return () => {
      window.removeEventListener('frianzo-push-token', tryRegister);
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}
