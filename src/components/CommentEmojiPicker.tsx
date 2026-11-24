'use client';

import { useState } from 'react';

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎',
  '🤩', '🥳', '😢', '😭', '😡', '😮', '😴', '🤔',
  '👍', '👎', '🙏', '👏', '💪', '👀', '❤️', '🔥',
  '💯', '🎉', '✨', '🌹', '🇵🇰', '😅', '😉', '🥰',
];

export default function CommentEmojiPicker({ onInsert }: { onInsert: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Add emoji"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 14.5c.8 1 2 1.6 3.5 1.6s2.7-.6 3.5-1.6" />
          <path d="M9 9.5h.01M15 9.5h.01" strokeWidth="2.6" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-11 right-0 z-50 grid w-64 grid-cols-8 gap-0.5 rounded-2xl border bg-white p-2 shadow-xl">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onInsert(emoji);
                setOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-slate-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
