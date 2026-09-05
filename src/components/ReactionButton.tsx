'use client';

import { useState, useRef } from 'react';
import { setReaction } from '@/lib/api/postApi';

const REACTIONS: Record<string, { emoji: string; label: string; color: string }> = {
  like: { emoji: '👍', label: 'Like', color: 'text-blue-600' },
  love: { emoji: '❤️', label: 'Love', color: 'text-red-600' },
  haha: { emoji: '😆', label: 'Haha', color: 'text-yellow-600' },
  wow: { emoji: '😮', label: 'Wow', color: 'text-yellow-600' },
  sad: { emoji: '😢', label: 'Sad', color: 'text-yellow-600' },
  angry: { emoji: '😠', label: 'Angry', color: 'text-orange-600' },
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
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

export default function ReactionButton({
  postId,
  myReaction,
  likeCount,
  onChange,
}: {
  postId: string;
  myReaction: string | null;
  likeCount: number;
  onChange: (reaction: string | null, count: number) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pressTimer = useRef<any>(null);

  async function apply(type: string) {
    playTapSound();
    setShowPicker(false);
    const result = await setReaction(postId, type);
    if (result.success) onChange(result.data.reaction, result.data.likeCount);
  }

  function handleTap() {
    apply(myReaction ? myReaction : 'like');
  }

  function startPress() {
    pressTimer.current = setTimeout(() => setShowPicker(true), 400);
  }
  function endPress() {
    clearTimeout(pressTimer.current);
  }

  const current = myReaction ? REACTIONS[myReaction] : null;

  return (
    <div className="relative">
      {showPicker && (
        <div
          className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-full border bg-white p-1.5 shadow-lg"
          onMouseLeave={() => setShowPicker(false)}
        >
          {Object.entries(REACTIONS).map(([key, r]) => (
            <button
              key={key}
              onClick={() => apply(key)}
              className="text-2xl transition-transform hover:scale-125"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={handleTap}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onMouseDown={startPress}
        onMouseUp={endPress}
        className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
          current ? 'bg-blue-50 ' + current.color : 'bg-slate-100 text-slate-600'
        }`}
      >
        <span>{current ? current.emoji : '👍'}</span>
        {current ? current.label : 'Like'} {likeCount > 0 ? `(${likeCount})` : ''}
      </button>
    </div>
  );
}
