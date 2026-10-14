'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-7 w-7">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const INTERESTS = [
  { id: 'comedy', label: 'Comedy', d: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'music', label: 'Music', d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
  { id: 'dance', label: 'Dance', d: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'sports', label: 'Sports', d: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zM12 8v4l3 3' },
  { id: 'food', label: 'Food', d: 'M12 6c-2 0-3 1.5-3 3 0 1 .5 2 1 2.5V19a1 1 0 001 1h2a1 1 0 001-1v-7.5c.5-.5 1-1.5 1-2.5 0-1.5-1-3-3-3zM7 3v4M5 5l2-2M17 3v4M19 5l-2-2' },
  { id: 'travel', label: 'Travel', d: 'M3 11l19-9-9 19-2-8-8-2z' },
  { id: 'fashion', label: 'Fashion', d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { id: 'tech', label: 'Tech', d: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'education', label: 'Education', d: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { id: 'gaming', label: 'Gaming', d: 'M15 5v2m0 4v2m3-2h-2M5 5v2m0 4v2m3-2h-2m-5-4h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z' },
  { id: 'pets', label: 'Pets', d: 'M4.5 12.75l6 6 9-13.5' },
  { id: 'art', label: 'Art', d: 'M7 21a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
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
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            <Icon d={item.d} />
            <span className="mt-1 text-xs font-medium text-slate-700">{item.label}</span>
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
