'use client';

import { useEffect } from 'react';

const DAYS_KEY = 'frianzo:reviewUsageDays';
const ASKED_KEY = 'frianzo:reviewAskedAt';
const MIN_DAYS = 2;
const COOLDOWN_MS = 120 * 24 * 60 * 60 * 1000;
const DELAY_MS = 45_000;

// Asks the Android app to show Google Play's in-app rating dialog, but
// only at a calm moment for a returning user: the person must have used
// the app on at least 2 different days, and we ask at most once every
// 120 days. Only runs inside the app (the native bridge must exist);
// in a browser this does nothing.
export default function ReviewPrompter() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const bridge = (window as any).FrianzoNative;
      if (!bridge || typeof bridge.requestReview !== 'function') return;

      const today = new Date().toISOString().slice(0, 10);
      let days: string[] = [];
      try {
        days = JSON.parse(localStorage.getItem(DAYS_KEY) || '[]');
        if (!Array.isArray(days)) days = [];
      } catch {
        days = [];
      }
      if (!days.includes(today)) {
        days.push(today);
        try {
          localStorage.setItem(DAYS_KEY, JSON.stringify(days.slice(-30)));
        } catch {
          // storage full or blocked; the day count just starts over
        }
      }
      if (days.length < MIN_DAYS) return;

      const askedAt = Number(localStorage.getItem(ASKED_KEY) || 0);
      if (askedAt && Date.now() - askedAt < COOLDOWN_MS) return;

      timer = setTimeout(() => {
        try {
          localStorage.setItem(ASKED_KEY, String(Date.now()));
          (window as any).FrianzoNative?.requestReview?.();
        } catch {
          // not running inside the app
        }
      }, DELAY_MS);
    } catch {
      // storage unavailable; skip quietly
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
