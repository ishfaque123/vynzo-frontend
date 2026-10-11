'use client';

import { useState } from 'react';
import { useDraggableStickers, DraggableStickerLayer, DraftSticker } from './useDraggableStickers';
import StickerSheets, { SheetKind } from './StickerSheets';
import { StickerFaceIcon } from './StickerIcons';

export type { DraftSticker };

export default function StickerComposer({
  mediaUrl,
  mediaType,
  onPost,
  onClose,
  posting,
}: {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onPost: (stickers: DraftSticker[]) => void;
  onClose: () => void;
  posting: boolean;
}) {
  const api = useDraggableStickers();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const selected = api.stickers.find((s) => s.localId === api.selectedId);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white" aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <span className="text-sm font-semibold text-white">Add stickers</span>
        <button
          onClick={() => onPost(api.stickers)}
          disabled={posting}
          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-4">
        <div
          ref={api.areaRef}
          className="relative max-h-full w-full max-w-md overflow-hidden rounded-xl bg-slate-900"
          style={{ aspectRatio: '9/16', maxHeight: '70vh' }}
          onTouchMove={api.onDrag}
          onTouchEnd={api.endDrag}
          onMouseMove={(e) => api.onDrag(e)}
          onMouseUp={api.endDrag}
          onMouseLeave={api.endDrag}
        >
          {mediaType === 'video' ? (
            <video src={mediaUrl} muted playsInline loop autoPlay className="h-full w-full object-cover" />
          ) : (
            <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
          )}
          <DraggableStickerLayer api={api} />
          {api.stickers.length === 0 && (
            <p className="absolute inset-x-0 top-1/3 px-6 text-center text-sm text-white/70">
              Tap the sticker button below to add a poll, question, countdown or link.
              Drag stickers to move them.
            </p>
          )}
        </div>
      </div>

      <div className="relative flex items-center justify-center gap-3 p-4">
        <button
          onClick={() => setSheet('types')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg"
          aria-label="Add sticker"
        >
          <StickerFaceIcon size={26} />
        </button>
        {selected && (
          <>
            <button onClick={() => api.removeSticker(selected.localId)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
              Remove
            </button>
            <button onClick={() => api.setSelectedId(null)} className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white">
              Done
            </button>
          </>
        )}
        <StickerSheets sheet={sheet} setSheet={setSheet} onAdd={api.addSticker} />
      </div>
    </div>
  );
}
