'use client';

import { useState, useRef } from 'react';
import { setReaction } from '@/lib/api/postApi';

export const REACTIONS: Record<string, { emoji: string; color: string; label: string }> = {
  like: { emoji: '👍', color: 'text-blue-600', label: 'Like' },
  love: { emoji: '❤️', color: 'text-red-600', label: 'Love' },
  haha: { emoji: '😆', color: 'text-yellow-600', label: 'Haha' },
  wow: { emoji: '😮', color: 'text-yellow-600', label: 'Wow' },
  sad: { emoji: '😢', color: 'text-yellow-600', label: 'Sad' },
  angry: { emoji: '😠', color: 'text-orange-600', label: 'Angry' },
};

function playTapSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

function ThumbIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 22h2a2 2 0 002-2v-8a2 2 0 00-2-2H7v12z" />
      <path d="M9 10l3-7a2 2 0 012 2v5h5a2 2 0 012 2l-1.5 7a2 2 0 01-2 1.5H9" />
    </svg>
  );
}

export default function ReactionButton({ postId, myReaction, likeCount, onChange }: { postId: string; myReaction: string | null; likeCount: number; onChange: (reaction: string | null, count: number) => void; }) {
  const [showPicker, setShowPicker] = useState(false);
  const pressTimer = useRef<any>(null);

  async function apply(type: string) {
    playTapSound();
    setShowPicker(false);
    const result = await setReaction(postId, type);
    if (result.success) onChange(result.data.reaction, result.data.likeCount);
  }

  function handleTap() { apply(myReaction ? myReaction : 'like'); }
  function startPress() { pressTimer.current = setTimeout(() => setShowPicker(true), 400); }
  function endPress() { clearTimeout(pressTimer.current); }

  const current = myReaction ? REACTIONS[myReaction] : null;

  return (
    <div className="relative flex-1">
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-full border bg-white p-1.5 shadow-lg" onMouseLeave={() => setShowPicker(false)}>
          {Object.entries(REACTIONS).map(([key, r]) => (
            <button key={key} onClick={() => apply(key)} className="text-2xl transition-transform hover:scale-125">{r.emoji}</button>
          ))}
        </div>
      )}
      <button
        onClick={handleTap}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onMouseDown={startPress}
        onMouseUp={endPress}
        className={`flex w-full items-center justify-center gap-2 py-1.5 text-[15px] font-medium ${current ? current.color : 'text-slate-600'}`}
      >
        {current ? <span className="text-xl leading-none">{current.emoji}</span> : <ThumbIcon />}
        {current ? current.label : 'Like'}
      </button>
    </div>
  );
}
