'use client';

import { useEffect, useState } from 'react';

// FB-style avatar: a coloured circle with the name's first letter is ALWAYS
// rendered underneath. The photo sits on top of it — while the photo loads,
// and if it fails or is broken, the letter shows instead of a blank circle.
const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#4F46E5', '#DB2777'];

// Avatar thumbnail (2026-11-02): the backend stores a ~96px JPEG next to
// every newly uploaded avatar, under the full avatar's R2 key with "-thumb"
// inserted before the extension (avatars/<uuid>.jpg -> avatars/<uuid>-thumb.jpg).
// Only R2 avatar URLs get a thumbnail candidate; external URLs (e.g. Google
// photos) are returned unchanged, and URLs without an extension are too.
export function avatarThumbUrl(url?: string | null): string | null {
  if (!url) return null;
  const marker = '/avatars/';
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  const after = url.slice(idx + marker.length);
  const dot = after.lastIndexOf('.');
  if (dot <= 0) return null;
  const ext = after.slice(dot);
  if (ext.includes('/') || ext.includes('?') || ext.includes('#')) return null;
  return `${url.slice(0, idx + marker.length + dot)}-thumb${ext}`;
}

export default function Avatar({ url, name, px = 40 }: { url?: string | null; name?: string | null; px?: number }) {
  const [failed, setFailed] = useState(false);
  const [triedFull, setTriedFull] = useState(false);
  useEffect(() => { setFailed(false); setTriedFull(false); }, [url]);
  const label = (name || '?').trim();
  const initial = (label[0] || '?').toUpperCase();
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  const bg = COLORS[hash % COLORS.length];
  // Small circles load the thumbnail first; if it does not exist yet
  // (avatars uploaded before thumbnails existed), fall back to the full
  // image once before giving up to the letter — never a blank circle.
  const thumb = avatarThumbUrl(url);
  const src = thumb && !triedFull ? thumb : url;
  return (
    <div
      className="relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white"
      style={{ width: px, height: px, backgroundColor: bg, fontSize: Math.max(10, Math.round(px * 0.42)) }}
      aria-hidden="true"
    >
      <span>{initial}</span>
      {src && !failed && (
        <img
          src={src}
          alt=""
          draggable={false}
          onError={() => {
            if (thumb && !triedFull && src === thumb) setTriedFull(true);
            else setFailed(true);
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
