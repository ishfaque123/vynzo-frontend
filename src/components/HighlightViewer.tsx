'use client';

import { useEffect, useState } from 'react';

export default function HighlightViewer({
  highlight,
  onClose,
}: {
  highlight: { title: string; items: { id: string; mediaUrl: string; mediaType?: string | null }[] };
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const items = highlight.items;

  useEffect(() => {
    setIndex(0);
  }, [highlight]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(items.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length, onClose]);

  if (items.length === 0) return null;
  const item = items[index];
  const isVideo = item.mediaType?.startsWith('video');

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black" onClick={onClose}>
      <div className="flex items-center gap-1 px-3 pt-3" onClick={(e) => e.stopPropagation()}>
        {items.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded bg-white/30">
            <div className={`h-full bg-white ${i < index ? 'w-full' : i === index ? 'w-1/2' : 'w-0'}`} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-2 text-white" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold">{highlight.title}</p>
        <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { (e.currentTarget as any)._sx = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const sx = (e.currentTarget as any)._sx;
          if (sx == null) return;
          const dx = e.changedTouches[0].clientX - sx;
          if (dx < -50) setIndex((i) => Math.min(items.length - 1, i + 1));
          else if (dx > 50) setIndex((i) => Math.max(0, i - 1));
        }}
      >
        {isVideo ? (
          <video key={item.id} src={item.mediaUrl} controls autoPlay playsInline className="max-h-full max-w-full" />
        ) : (
          <img key={item.id} src={item.mediaUrl} alt="" className="max-h-full max-w-full object-contain" />
        )}
        {index > 0 && (
          <button onClick={() => setIndex((i) => i - 1)} aria-label="Previous" className="absolute left-2 rounded-full bg-black/40 p-2 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
        {index < items.length - 1 && (
          <button onClick={() => setIndex((i) => i + 1)} aria-label="Next" className="absolute right-2 rounded-full bg-black/40 p-2 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
