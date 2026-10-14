'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const INTERESTS = [
  { id: 'comedy', label: 'Comedy', icon: '😂' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'dance', label: 'Dance', icon: '💃' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'food', label: 'Food', icon: '🍔' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'fashion', label: 'Fashion', icon: '👗' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'pets', label: 'Pets', icon: '🐶' },
  { id: 'art', label: 'Art', icon: '🎨' },
];

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data?.user?.interests)) {
          setSelected(d.data.user.interests);
        }
      })
      .catch(() => {});
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/interests`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ interests: selected }),
      });
      router.back();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-xl font-bold">Your Interests</h1>
      <p className="mt-1 text-sm text-slate-500">Pick what you love — your For You feed will show more of it.</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {INTERESTS.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className={`flex flex-col items-center rounded-xl border p-3 transition-colors ${
              selected.includes(item.id)
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="mt-1 text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving...' : `Save (${selected.length} selected)`}
      </button>
    </div>
  );
}
