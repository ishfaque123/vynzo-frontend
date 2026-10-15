'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { chatWithIsai, IsaiChatMessage } from '@/lib/api/isaiApi';

function BackIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function SendIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
}
function SparklesIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" /></svg>;
}

type Msg = { role: 'user' | 'isai'; text: string };

const STARTERS = [
  'Frianzo kis ne banaya hai?',
  'Meri video ForYou par kyun nahi chal rahi?',
  'Video viral kaise karun?',
  'Blue tick kaise milega?',
];

export default function AiAssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'isai', text: 'Assalamualaikum! Main ISAI hoon — Frianzo ka AI assistant. Frianzo ke baare mein kuch bhi poochein.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (raw?: string) => {
    const content = (raw ?? input).trim();
    if (!content || sending) return;
    const next = [...messages, { role: 'user' as const, text: content }];
    setMessages(next);
    setInput('');
    setSending(true);
    const apiMessages: IsaiChatMessage[] = next.slice(-10).map((m) => ({
      role: m.role === 'isai' ? 'assistant' : 'user',
      content: m.text,
    }));
    const r: any = await chatWithIsai(apiMessages);
    setSending(false);
    if (r.success) {
      setMessages((v) => [...v, { role: 'isai', text: r.data.reply }]);
      if (typeof r.data.remaining === 'number') setRemaining(r.data.remaining);
    } else {
      setMessages((v) => [...v, { role: 'isai', text: r.error?.message || 'Kuch garbar ho gayi. Dobara try karein.' }]);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-64px)] w-full max-w-xl flex-col px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-2 text-slate-900" aria-label="Back">
          <BackIcon />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-violet-600"><SparklesIcon /></span>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-900">ISAI</h1>
            <p className="text-xs text-slate-500">Frianzo AI Assistant</p>
          </div>
        </div>
        {remaining !== null && (
          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">{remaining} left today</span>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-md bg-blue-600 text-white'
                  : 'rounded-bl-md border bg-white text-slate-800 shadow-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border bg-white px-4 py-3 shadow-sm">
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.15s' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && !sending && (
        <div className="mb-2 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs text-violet-700 hover:bg-violet-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t bg-white pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="ISAI se kuch poochein..."
          maxLength={1000}
          className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none focus:border-violet-400"
        />
        <button
          onClick={() => send()}
          disabled={sending || !input.trim()}
          className="rounded-full bg-violet-600 p-2.5 text-white disabled:opacity-40"
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
