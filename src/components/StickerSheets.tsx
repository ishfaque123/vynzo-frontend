'use client';

import { useState } from 'react';
import { PollIcon, QuestionIcon, CountdownIcon, LinkIcon } from './StickerIcons';

export type SheetKind = null | 'types' | 'poll' | 'question' | 'countdown' | 'link';

/** Bottom sheets for configuring a sticker. Self-contained; calls onAdd when done. */
export default function StickerSheets({
  sheet,
  setSheet,
  onAdd,
}: {
  sheet: SheetKind;
  setSheet: (s: SheetKind) => void;
  onAdd: (type: 'poll' | 'question' | 'countdown' | 'link', data: Record<string, any>) => void;
}) {
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState(['', '']);
  const [qPrompt, setQPrompt] = useState('');
  const [cdTitle, setCdTitle] = useState('');
  const [cdDate, setCdDate] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');

  function reset() {
    setPollQ('');
    setPollOpts(['', '']);
    setQPrompt('');
    setCdTitle('');
    setCdDate('');
    setLinkUrl('');
    setLinkLabel('');
  }

  function add(type: 'poll' | 'question' | 'countdown' | 'link', data: Record<string, any>) {
    onAdd(type, data);
    reset();
    setSheet(null);
  }

  if (!sheet) return null;

  const wrap = (children: React.ReactNode) => (
    <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );

  if (sheet === 'types') {
    return wrap(
      <>
        <p className="mb-3 text-center text-sm font-semibold text-slate-800">Choose a sticker</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { t: 'poll', Icon: PollIcon, label: 'Poll' },
            { t: 'question', Icon: QuestionIcon, label: 'Question' },
            { t: 'countdown', Icon: CountdownIcon, label: 'Countdown' },
            { t: 'link', Icon: LinkIcon, label: 'Link' },
          ].map((o) => (
            <button
              key={o.t}
              onClick={() => setSheet(o.t as SheetKind)}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-slate-700 hover:bg-slate-50"
            >
              <o.Icon size={22} />
              <span className="text-sm font-medium text-slate-800">{o.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setSheet(null)} className="mt-3 w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
      </>
    );
  }

  if (sheet === 'poll') {
    return wrap(
      <>
        <p className="mb-3 text-center text-sm font-semibold text-slate-800">Poll</p>
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
            onClick={() => pollQ.trim() && pollOpts.filter((o) => o.trim()).length >= 2 && add('poll', { question: pollQ.trim(), options: pollOpts.map((o) => o.trim()).filter(Boolean) })}
            disabled={!pollQ.trim() || pollOpts.filter((o) => o.trim()).length < 2}
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >Add</button>
        </div>
      </>
    );
  }

  if (sheet === 'question') {
    return wrap(
      <>
        <p className="mb-3 text-center text-sm font-semibold text-slate-800">Question</p>
        <input value={qPrompt} onChange={(e) => setQPrompt(e.target.value)} placeholder="Ask me anything..." maxLength={100}
          className="mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
        <div className="flex gap-2">
          <button onClick={() => setSheet('types')} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-700">Back</button>
          <button onClick={() => qPrompt.trim() && add('question', { prompt: qPrompt.trim() })}
            disabled={!qPrompt.trim()} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Add</button>
        </div>
      </>
    );
  }

  if (sheet === 'countdown') {
    return wrap(
      <>
        <p className="mb-3 text-center text-sm font-semibold text-slate-800">Countdown</p>
        <input value={cdTitle} onChange={(e) => setCdTitle(e.target.value)} placeholder="Countdown to..." maxLength={60}
          className="mb-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
        <input type="datetime-local" value={cdDate} onChange={(e) => setCdDate(e.target.value)}
          className="mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
        <div className="flex gap-2">
          <button onClick={() => setSheet('types')} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-700">Back</button>
          <button
            onClick={() => {
              const t = new Date(cdDate).getTime();
              if (cdTitle.trim() && cdDate && t > Date.now()) add('countdown', { title: cdTitle.trim(), targetAt: new Date(t).toISOString() });
            }}
            disabled={!cdTitle.trim() || !cdDate || new Date(cdDate).getTime() <= Date.now()}
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >Add</button>
        </div>
      </>
    );
  }

  return wrap(
    <>
      <p className="mb-3 text-center text-sm font-semibold text-slate-800">Link</p>
      <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." inputMode="url"
        className="mb-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
      <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Label (optional)" maxLength={40}
        className="mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400" />
      <div className="flex gap-2">
        <button onClick={() => setSheet('types')} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-700">Back</button>
        <button onClick={() => linkUrl.trim() && add('link', { url: linkUrl.trim(), label: linkLabel.trim() })}
          disabled={!linkUrl.trim()} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Add</button>
      </div>
    </>
  );
}
