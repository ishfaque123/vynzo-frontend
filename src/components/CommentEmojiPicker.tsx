'use client';

import { useState } from 'react';

const RECENT_KEY = 'frianzo:recent-emojis';
const RECENT_MAX = 24;

// Pinned quick row: the eight most-used emojis, always visible at the
// top of the panel above the scrollable category grid.
const TOP_EMOJIS = ['😂', '❤️', '😍', '👍', '🙏', '🔥', '👏', '😊'];

const CATEGORIES: { id: string; icon: string; emojis: string[] }[] = [
  {
    id: 'smileys',
    icon: '😀',
    emojis: ['😀', '😁', '😂', '🤣', '😅', '😆', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '🙂', '🤗', '🤩', '🤔', '😐', '😑', '🙄', '😏', '😮', '😪', '😴', '😌', '😛', '😜', '🤤', '😒', '😓', '😔', '😕', '🙃', '😲', '🙁', '😖', '😞', '😤', '😢', '😭', '😱', '😳', '🤯', '😰', '🥱', '😫', '😩'],
  },
  {
    id: 'people',
    icon: '👍',
    emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '✋', '🤚', '🖐️', '🖖', '👋', '👐', '🙌', '👏', '🤝', '🙏', '✍️', '💪', '👀'],
  },
  {
    id: 'animals',
    icon: '🐻',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🐴', '🦄', '🐝', '🦋', '🐞', '🌸', '🌹', '🌺', '🌻', '🍀', '🌴'],
  },
  {
    id: 'food',
    icon: '🍔',
    emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🍍', '🥝', '🍅', '🥑', '🥦', '🥒', '🌶️', '🍞', '🧀', '🍖', '🍗', '🍔', '🍟', '🍕', '🌮', '🍜', '🍣', '🍦', '🍩', '🍰', '🎂', '🍺', '🍷', '☕', '🧃', '🍿'],
  },
  {
    id: 'activity',
    icon: '⚽',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏏', '🎯', '🎮', '🎲', '🎭', '🎨', '🎤', '🎧', '🎼', '🎹', '🎸', '🎻', '🏆', '🥇', '🎖️', '🎫', '🚴', '🏋️', '🤸'],
  },
  {
    id: 'travel',
    icon: '🚗',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🛵', '🏍️', '🚲', '✈️', '🚀', '🚁', '🚂', '🚆', '🚢', '⛵', '🏠', '🏰', '🗼', '🎡', '🎢', '🌍', '🗺️', '🏖️', '🏝️', '⛰️', '🌋'],
  },
  {
    id: 'objects',
    icon: '💡',
    emojis: ['⌚', '📱', '💻', '⌨️', '🖥️', '📷', '📸', '🔦', '💡', '📚', '📖', '✏️', '📝', '🔒', '🔑', '🔨', '⚙️', '🧰', '💎', '💰', '💳', '📦', '🎁', '🎈', '📩', '✉️', '📞', '🔋', '🔌', '🚬'],
  },
  {
    id: 'symbols',
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '⭐', '🌟', '💫', '💥', '💦', '🎵', '🎶', '✔️', '❌', '❓', '❗', '💯', '🔆'],
  },
];

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((e) => typeof e === 'string') : [];
  } catch {
    return [];
  }
}

function saveRecent(emoji: string): string[] {
  const next = [emoji, ...loadRecents().filter((e) => e !== emoji)].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); recents are best-effort.
  }
  return next;
}

export function EmojiToggleButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label="Add emoji"
      onClick={onToggle}
      className={`flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 ${open ? 'text-sky-500' : 'text-slate-500'}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.5c.8 1 2 1.6 3.5 1.6s2.7-.6 3.5-1.6" />
        <path d="M9 9.5h.01M15 9.5h.01" strokeWidth="2.6" />
      </svg>
    </button>
  );
}

export function CommentEmojiPanel({ onInsert, onKeyboard }: { onInsert: (emoji: string) => void; onKeyboard: () => void }) {
  const [tab, setTab] = useState<string>('smileys');
  const [recents, setRecents] = useState<string[]>(() => loadRecents());

  function pick(emoji: string) {
    setRecents(saveRecent(emoji));
    onInsert(emoji);
  }

  const activeEmojis = tab === 'recent' ? recents : CATEGORIES.find((c) => c.id === tab)?.emojis || [];

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border bg-slate-50">
      <div className="grid grid-cols-8 gap-0.5 border-b bg-white p-2">
        {TOP_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => pick(emoji)}
            className="flex h-10 items-center justify-center rounded-lg text-2xl hover:bg-slate-100"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="h-56 overflow-y-auto p-2">
        {tab === 'recent' && (
          <p className="px-1 pb-1 text-xs font-medium text-slate-400">Recent</p>
        )}
        {activeEmojis.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-slate-400">No recent emojis yet.</p>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {activeEmojis.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                type="button"
                onClick={() => pick(emoji)}
                className="flex h-10 items-center justify-center rounded-lg text-2xl hover:bg-slate-200/70"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 border-t bg-white px-1.5 py-1">
        <button
          type="button"
          aria-label="Recent emojis"
          onClick={() => setTab('recent')}
          className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${tab === 'recent' ? 'bg-slate-100' : ''}`}
        >
          🕐
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            aria-label={cat.id}
            onClick={() => setTab(cat.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${tab === cat.id ? 'bg-slate-100' : ''}`}
          >
            {cat.icon}
          </button>
        ))}
        <button
          type="button"
          aria-label="Show keyboard"
          onClick={onKeyboard}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
