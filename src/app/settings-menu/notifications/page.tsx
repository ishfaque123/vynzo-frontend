'use client';

import { useEffect, useState } from 'react';
import { fetchNotificationPreferences, setNotificationPreference } from '@/lib/api/notificationApi';

const CATEGORIES = [
  { value: 'likes', label: 'Likes', desc: 'When someone likes your posts, reels or comments' },
  { value: 'comments', label: 'Comments', desc: 'When someone comments on or replies to you' },
  { value: 'follows', label: 'New followers', desc: 'When someone starts following you' },
  { value: 'mentions', label: 'Mentions', desc: 'When someone mentions or tags you' },
  { value: 'shares', label: 'Shares', desc: 'When someone shares your posts' },
] as const;

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificationPreferences().then((result) => {
      if (result.success) {
        const map: Record<string, boolean> = {};
        for (const p of result.data.preferences) map[p.category] = p.enabled;
        setPrefs(map);
      }
      setLoading(false);
    });
  }, []);

  async function toggle(category: string) {
    const next = !(prefs[category] !== false);
    setPrefs((prev) => ({ ...prev, [category]: next }));
    const result = await setNotificationPreference(category, next);
    if (!result.success) {
      setPrefs((prev) => ({ ...prev, [category]: !next }));
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold">Notifications</h1>
        <div className="divide-y rounded-lg border">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse px-4 py-4">
              <div className="h-4 w-24 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Notifications</h1>
      <div className="divide-y rounded-lg border">
        {CATEGORIES.map((c) => {
          const enabled = prefs[c.value] !== false;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => toggle(c.value)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              aria-pressed={enabled}
            >
              <span>
                <span className="block font-medium text-slate-900">{c.label}</span>
                <span className="block text-xs text-slate-500">{c.desc}</span>
              </span>
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
