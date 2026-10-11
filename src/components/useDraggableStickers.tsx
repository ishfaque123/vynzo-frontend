'use client';

import { useRef, useState } from 'react';
import { StickerTypeIcon } from './StickerIcons';

export interface DraftSticker {
  localId: string;
  type: 'poll' | 'question' | 'countdown' | 'link';
  posX: number;
  posY: number;
  data: Record<string, any>;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/** Shared sticker state + drag logic for story composers (media + text). */
export function useDraggableStickers() {
  const [stickers, setStickers] = useState<DraftSticker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  function addSticker(type: DraftSticker['type'], data: Record<string, any>) {
    const y = 30 + stickers.length * 12;
    setStickers((prev) => [...prev, { localId: uid(), type, posX: 50, posY: Math.min(y, 78), data }]);
  }

  function removeSticker(id: string) {
    setStickers((prev) => prev.filter((s) => s.localId !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }

  function clearStickers() {
    setStickers([]);
    setSelectedId(null);
  }

  function startDrag(e: React.TouchEvent | React.MouseEvent, id: string) {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const st = stickers.find((s) => s.localId === id);
    if (!st) return;
    const sx = (st.posX / 100) * rect.width;
    const sy = (st.posY / 100) * rect.height;
    dragRef.current = { id, dx: cx - rect.left - sx, dy: cy - rect.top - sy };
    setSelectedId(id);
  }

  function onDrag(e: React.TouchEvent | React.MouseEvent) {
    const d = dragRef.current;
    const el = areaRef.current;
    if (!d || !el) return;
    const rect = el.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const px = Math.min(92, Math.max(8, ((cx - rect.left - d.dx) / rect.width) * 100));
    const py = Math.min(92, Math.max(8, ((cy - rect.top - d.dy) / rect.height) * 100));
    setStickers((prev) => prev.map((s) => (s.localId === d.id ? { ...s, posX: px, posY: py } : s)));
  }

  function endDrag() {
    dragRef.current = null;
  }

  function stickerLabel(s: DraftSticker) {
    if (s.type === 'poll') return s.data.question || 'Poll';
    if (s.type === 'question') return s.data.prompt || 'Question';
    if (s.type === 'countdown') return s.data.title || 'Countdown';
    return s.data.label || 'Link';
  }

  return {
    stickers, selectedId, setSelectedId, areaRef,
    addSticker, removeSticker, clearStickers,
    startDrag, onDrag, endDrag, stickerLabel,
  };
}

export type StickerApi = ReturnType<typeof useDraggableStickers>;

/** Renders draggable sticker chips over a positioned parent. */
export function DraggableStickerLayer({ api }: { api: StickerApi }) {
  return (
    <>
      {api.stickers.map((s) => (
        <div
          key={s.localId}
          className="absolute z-10"
          style={{ left: `${s.posX}%`, top: `${s.posY}%`, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
          onTouchStart={(e) => api.startDrag(e, s.localId)}
          onMouseDown={(e) => api.startDrag(e, s.localId)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              api.setSelectedId(s.localId);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex max-w-[180px] items-center gap-1.5 truncate rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg ${
              api.selectedId === s.localId ? 'bg-slate-900 text-white ring-2 ring-white' : 'bg-white/95 text-slate-900'
            }`}
          >
            <span className="shrink-0 opacity-70"><StickerTypeIcon type={s.type} size={14} /></span>
            <span className="truncate">{api.stickerLabel(s)}</span>
          </button>
        </div>
      ))}
    </>
  );
}
