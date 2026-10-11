'use client';

import { useEffect, useState } from 'react';
import { votePoll, answerQuestion } from '@/lib/api/statusApi';

function useCountdown(targetAt: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(targetAt).getTime() - now;
  if (diff <= 0) return 'Ended';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function PollSticker({ sticker, isOwner, onVoted }: { sticker: any; isOwner: boolean; onVoted: (s: any) => void }) {
  const [voting, setVoting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const opts: string[] = sticker.data.options || [];
  const results = sticker.results;
  const voted = sticker.myVote !== null && sticker.myVote !== undefined;
  const showBars = isOwner || voted || showResults;

  async function vote(i: number) {
    if (voted || voting || isOwner) return;
    setVoting(true);
    const res = await votePoll(sticker.id, i);
    setVoting(false);
    if (res.success) onVoted(res.data);
  }

  return (
    <div
      className="w-52 rounded-2xl bg-white/95 p-3 shadow-xl"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p className="mb-2 text-center text-xs font-bold text-slate-900">{sticker.data.question}</p>
      <div className="space-y-1.5">
        {opts.map((o, i) => {
          const pct = results && results.total > 0 ? Math.round((results.counts[i] / results.total) * 100) : 0;
          const mine = sticker.myVote === i;
          return (
            <button
              key={i}
              onClick={() => vote(i)}
              disabled={showBars || voting}
              className={`relative w-full overflow-hidden rounded-lg px-2 py-1.5 text-left text-xs font-medium ${
                mine ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
              } disabled:cursor-default`}
            >
              {showBars && results && (
                <span
                  className={`absolute inset-y-0 left-0 ${mine ? 'bg-blue-700' : 'bg-slate-300'}`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative flex items-center justify-between">
                <span className="truncate">{o}</span>
                {showBars && results && <span className="ml-1 flex-shrink-0">{pct}%</span>}
              </span>
            </button>
          );
        })}
      </div>
      {results && (
        <p className="mt-1.5 text-center text-[10px] text-slate-500">
          {results.total} {results.total === 1 ? 'vote' : 'votes'}
          {!isOwner && !voted && (
            <button onClick={() => setShowResults((v) => !v)} className="ml-1 underline">
              {showResults ? 'hide' : 'results'}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

function QuestionSticker({ sticker, isOwner, onOpenResults }: { sticker: any; isOwner: boolean; onOpenResults: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(!!sticker.myAnswer);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await answerQuestion(sticker.id, text.trim());
    setSending(false);
    if (res.success) {
      setDone(true);
      setOpen(false);
      setText('');
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => (isOwner ? onOpenResults() : setOpen(true))}
        className="w-52 rounded-2xl bg-white/95 p-3 text-center shadow-xl"
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-purple-600">Ask me</p>
        <p className="mt-0.5 text-xs font-bold text-slate-900">{sticker.data.prompt}</p>
        {isOwner ? (
          <p className="mt-1 text-[10px] text-slate-500">{sticker.answerCount || 0} answers — tap to view</p>
        ) : done ? (
          <p className="mt-1 text-[10px] text-green-600">✓ Answered</p>
        ) : (
          <p className="mt-1 text-[10px] text-slate-500">Tap to answer</p>
        )}
      </button>
      {open && !isOwner && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-sm font-bold text-slate-900">{sticker.data.prompt}</p>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Type your answer..."
              className="mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownSticker({ sticker }: { sticker: any }) {
  const left = useCountdown(sticker.data.targetAt);
  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 px-4 py-2.5 text-center shadow-xl"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-bold text-white">{sticker.data.title}</p>
      <p className="font-mono text-lg font-bold tabular-nums text-white">{left}</p>
    </div>
  );
}

function LinkSticker({ sticker }: { sticker: any }) {
  return (
    <a
      href={sticker.data.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-xl"
    >
      <span>🔗</span>
      <span className="max-w-[140px] truncate">{sticker.data.label}</span>
    </a>
  );
}

export default function StoryStickers({
  stickers,
  isOwner,
  onStickerUpdate,
}: {
  stickers: any[];
  isOwner: boolean;
  onStickerUpdate: (id: string, patch: any) => void;
}) {
  const [resultsFor, setResultsFor] = useState<any | null>(null);

  if (!stickers?.length) return null;

  return (
    <>
      {stickers.map((s) => (
        <div
          key={s.id}
          className="absolute z-10"
          style={{ left: `${s.posX}%`, top: `${s.posY}%`, transform: 'translate(-50%, -50%)' }}
        >
          {s.type === 'poll' && (
            <PollSticker
              sticker={s}
              isOwner={isOwner}
              onVoted={(d) => onStickerUpdate(s.id, { myVote: d.optionIndex, results: d.results || s.results })}
            />
          )}
          {s.type === 'question' && (
            <QuestionSticker sticker={s} isOwner={isOwner} onOpenResults={() => setResultsFor(s)} />
          )}
          {s.type === 'countdown' && <CountdownSticker sticker={s} />}
          {s.type === 'link' && <LinkSticker sticker={s} />}
        </div>
      ))}

      {resultsFor && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50" onClick={() => setResultsFor(null)}>
          <div
            className="max-h-[60vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-center text-sm font-bold text-slate-900">
              {resultsFor.type === 'poll' ? resultsFor.data.question : resultsFor.data.prompt}
            </p>
            {resultsFor.type === 'poll' && resultsFor.results && (
              <div className="mt-3 space-y-2">
                {resultsFor.data.options.map((o: string, i: number) => {
                  const total = resultsFor.results.total || 0;
                  const pct = total > 0 ? Math.round((resultsFor.results.counts[i] / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>{o}</span>
                        <span>{pct}% ({resultsFor.results.counts[i]})</span>
                      </div>
                      <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="pt-1 text-center text-xs text-slate-500">{resultsFor.results.total} votes</p>
              </div>
            )}
            {resultsFor.type === 'question' && (
              <div className="mt-3 space-y-2">
                {(resultsFor.answers || []).length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-400">No answers yet.</p>
                )}
                {(resultsFor.answers || []).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
                    <span
                      className="h-7 w-7 flex-shrink-0 rounded-full bg-slate-200 bg-cover bg-center"
                      style={a.user?.profilePictureUrl ? { backgroundImage: `url(${a.user.profilePictureUrl})` } : {}}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700">{a.user?.displayName || a.user?.username}</p>
                      <p className="break-words text-sm text-slate-900">{a.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setResultsFor(null)}
              className="mt-4 w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
