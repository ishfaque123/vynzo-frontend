'use client';

import { useRef, useState } from 'react';

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

function StickerChip({ s, selected, onTap }: { s: DraftSticker; selected: boolean; onTap: () => void }) {
  let label = '';
  if (s.type === 'poll') label = `📊 ${s.data.question || 'Poll'}`;
  else if (s.type === 'question') label = `❓ ${s.data.prompt || 'Question'}`;
  else if (s.type === 'countdown') label = `⏳ ${s.data.title || 'Countdown'}`;
  else label = `🔗 ${s.data.label || 'Link'}`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={`max-w-[70%] truncate rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg ${
        selected ? 'bg-slate-900 text-white ring-2 ring-white' : 'bg-white/95 text-slate-900'
      }`}
    >
      {label}
    </button>
  );
}

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
  const [stickers, setStickers] = useState<DraftSticker[]>([]);
  const [sheet, setSheet] = useState<null | 'types' | 'poll' | 'question' | 'countdown' | 'link'>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState(['', '']);
  const [qPrompt, setQPrompt] = useState('');
  const [cdTitle, setCdTitle] = useState('');
  const [cdDate, setCdDate] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  function resetForms() {
    setPollQ('');
    setPollOpts(['', '']);
    setQPrompt('');
    setCdTitle('');
    setCdDate('');
    setLinkUrl('');
    setLinkLabel('');
  }

  function addSticker(type: DraftSticker['type'], data: Record<string, any>) {
    const y = 30 + stickers.length * 12;
    setStickers((prev) => [...prev, { localId: uid(), type, posX: 50, posY: Math.min(y, 78), data }]);
    resetForms();
    setSheet(null);
  }

  function startDrag(e: React.TouchEvent | React.MouseEvent, id: string) {
    const el = previewRef.current;
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
    const el = previewRef.current;
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

  function removeSelected() {
    if (!selectedId) return;
    setStickers((prev) => prev.filter((s) => s.localId !== selectedId));
    setSelectedId(null);
  }

  const selected = stickers.find((s) => s.localId === selectedId);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white" aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <span className="text-sm font-semibold text-white">Add stickers</span>
        <button
          onClick={() => onPost(stickers)}
          disabled={posting}
          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-4">
        <div
          ref={previewRef}
          className="relative max-h-full w-full max-w-md overflow-hidden rounded-xl bg-slate-900"
          style={{ aspectRatio: '9/16', maxHeight: '70vh' }}
          onTouchMove={onDrag}
          onTouchEnd={endDrag}
          onMouseMove={(e) => dragRef.current && onDrag(e)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
        >
          {mediaType === 'video' ? (
            <video src={mediaUrl} muted playsInline loop autoPlay className="h-full w-full object-cover" />
          ) : (
            <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
          )}
          {stickers.map((s) => (
            <div
              key={s.localId}
              className="absolute"
              style={{ left: `${s.posX}%`, top: `${s.posY}%`, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
              onTouchStart={(e) => startDrag(e, s.localId)}
              onMouseDown={(e) => startDrag(e, s.localId)}
            >
              <StickerChip s={s} selected={selectedId === s.localId} onTap={() => setSelectedId(s.localId)} />
            </div>
          ))}
          {stickers.length === 0 && (
            <p className="absolute inset-x-0 top-1/3 px-6 text-center text-sm text-white/70">
              Tap the sticker button below to add a poll, question, countdown or link.
              Drag stickers to move them.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 p-4">
        <button
          onClick={() => setSheet('types')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-lg"
          aria-label="Add sticker"
        >
          🙂
        </button>
        {selected && (
          <>
            <button onClick={removeSelected} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
              Remove
            </button>
            <button onClick={() => setSelectedId(null)} className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white">
              Done
            </button>
          </>
        )}
      </div>

      {sheet === 'types' && (
        <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
          <p className="mb-3 text-center text-sm font-semibold text-slate-800">Choose a sticker</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { t: 'poll', icon: '📊', label: 'Poll' },
              { t: 'question', icon: '❓', label: 'Question' },
              { t: 'countdown', icon: '⏳', label: 'Countdown' },
              { t: 'link', icon: '🔗', label: 'Link' },
            ].map((o) => (
              <button
                key={o.t}
                onClick={() => setSheet(o.t as any)}
                className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left hover:bg-slate-50"
              >
                <span className="text-xl">{o.icon}</span>
                <span className="text-sm font-medium text-slate-800">{o.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setSheet(null)} className="mt-3 w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
        </div>
      )}

      {sheet === 'poll' && (
        <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-2xl bg-white p-4 pb-6">
          <p className="mb-3 text-center text-sm font-semibold text-slate-800">📊 Poll</p>
          <input value={pollQ} onChange={(e) => setPollQ(e.target.value)} placeholder="Ask a question..." maxLength={100}
            className="mb-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
          {pollOpts.map((o, i) => (
            <input key={i} value={o} onChange={(e) => setPollOpts((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={`Option ${i + 1}`} maxLength={40}
              className="mb-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
          ))}
          {pollOpts.length < 4 && (
            <button onClick={() => setPollOpts((p) => [...p, ''])} className="mb-3 text-sm font-medium text-blue-600">+ Add option</button>
          )}
          <div className="flex gap-2">
            <button onClick={() => setSheet('types')} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-700">Back</button>
            <button
              onClick={() => pollQ.trim() && pollOpts.filter((o) => o.trim()).length >= 2 && addSticker('poll', { question: pollQ.trim(), options: pollOpts.map((o) => o.trim()).filter(Boolean) })}
              disabled={!pollQ.trim() || pollOpts.filter((o) => o.trim()).length < 2}
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >Add</button>
          </div>
        </div>
      )}

      {sheet === 'question' && (
        <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-2xl bg-white p-4 pb-6">
          <p className="mb-3 text-center text-sm font-semibold text-slate-800">❓ Question</p>
          <input value={qPrompt} onChange={(e) => setQPrompt(e.target.value)} placeholder="Ask me anything..." maxLength={100}
            className="mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
          <div className="flex gap-2">
            <button onClick={() => setSheet('types')} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-700">Back</button>
            <button onClick={() => qPrompt.trim() && addSticker('question', { prompt: qPrompt.trim() })}
              disabled={!qPrompt.trim()} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Add</button>
          </div>
        </div>
      )}

      {sheet === 'countdown' && (
        <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-2xl bg-white p-4 pb-6">
          <p className="mb-3 text-center text-sm font-semibold text-slate-800">⏳ Countdown</p>
          <input value={cdTitle} onChange={(e) => setCdTitle(e.target.value)} placeholder="Countdown to..." maxLength={60}
            className="mb-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
          <input type="datetime-local" value={cdDate} onChange={(e) => setCdDate(e.target.value)}
            className="mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
          <div className="flex gap-2">
            <button onClick={() => setSheet('types')} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-700">Back</button>
            <button
              onClick={() => {
                const t = new Date(cdDate).getTime();
                if (cdTitle.trim() && cdDate && t > Date.now()) addSticker('countdown', { title: cdTitle.trim(), targetAt: new Date(t).toISOString() });
              }}
              disabled={!cdTitle.trim() || !cdDate || new Date(cdDate).getTime() <= Date.now()}
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >Add</button>
          </div>
        </div>
      )}

      {sheet === 'link' && (
        <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-2xl bg-white p-4 pb-6">
          <p className="mb-3 text-center text-sm font-semibold text-slate-800">🔗 Link</p>
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." inputMode="url"
            className="mb-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
          <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Label (optional)" maxLength={40}
            className="mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
          <div className="flex gap-2">
            <button onClick={() => setSheet('types')} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-700">Back</button>
            <button onClick={() => linkUrl.trim() && addSticker('link', { url: linkUrl.trim(), label: linkLabel.trim() })}
              disabled={!linkUrl.trim()} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
