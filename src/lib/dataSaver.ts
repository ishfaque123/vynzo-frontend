'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'frianzo-data-saver';

let cached: boolean | null = null;
const listeners = new Set<() => void>();

function read(): boolean {
  if (cached !== null) return cached;
  try {
    cached = localStorage.getItem(KEY) === '1';
  } catch {
    cached = false;
  }
  return cached;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Non-reactive read (for event handlers / effects). */
export function isDataSaver(): boolean {
  return read();
}

/** Persist the setting and notify all subscribers. */
export function setDataSaver(v: boolean): void {
  cached = v;
  try {
    localStorage.setItem(KEY, v ? '1' : '0');
  } catch {
    // storage unavailable — keep in-memory value
  }
  listeners.forEach((cb) => cb());
}

/** Reactive hook — re-renders when the setting changes. */
export function useDataSaver(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
