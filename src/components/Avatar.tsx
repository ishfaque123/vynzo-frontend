'use client';

import { useState } from 'react';

// FB-style avatar: a coloured circle with the name's first letter is ALWAYS
// rendered underneath. The photo sits on top of it — while the photo loads,
// and if it fails or is broken, the letter shows instead of a blank circle.
const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#4F46E5', '#DB2777'];

export default function Avatar({ url, name, px = 40 }: { url?: string | null; name?: string | null; px?: number }) {
  const [failed, setFailed] = useState(false);
  const label = (name || '?').trim();
  const initial = (label[0] || '?').toUpperCase();
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  const bg = COLORS[hash % COLORS.length];
  return (
    <div
      className="relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white"
      style={{ width: px, height: px, backgroundColor: bg, fontSize: Math.max(10, Math.round(px * 0.42)) }}
      aria-hidden="true"
    >
      <span>{initial}</span>
      {url && !failed && (
        <img
          src={url}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
