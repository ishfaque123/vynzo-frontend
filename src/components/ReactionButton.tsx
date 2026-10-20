'use client';

import { useState, useRef, useEffect } from 'react';
import { setReaction } from '@/lib/api/postApi';
import { playReactionSound } from '@/lib/sounds';
import ReactionIcon from './ReactionIcon';

export const REACTIONS: Record<string, { emoji: string; color: string; label: string }> = {
  like: { emoji: '👍', color: 'text-blue-600', label: 'Like' },
  love: { emoji: '❤️', color: 'text-red-600', label: 'Love' },
  haha: { emoji: '😆', color: 'text-yellow-600', label: 'Haha' },
  wow: { emoji: '😮', color: 'text-yellow-600', label: 'Wow' },
  sad: { emoji: '😢', color: 'text-yellow-600', label: 'Sad' },
  angry: { emoji: '😠', color: 'text-orange-600', label: 'Angry' },
};

const HOLD_TO_OPEN_MS = 400;

function ThumbIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "2.2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 22h2a2 2 0 002-2v-8a2 2 0 00-2-2H7v12z" />
      <path d="M9 10l3-7a2 2 0 012 2v5h5a2 2 0 012 2l-1.5 7a2 2 0 01-2 1.5H9" />
    </svg>
  );
}

export default function ReactionButton({ postId, myReaction, likeCount, onChange }: { postId: string; myReaction: string | null; likeCount: number; onChange: (reaction: string | null, count: number) => void; }) {
  const [showPicker, setShowPicker] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [justReacted, setJustReacted] = useState(false);
  const pressTimer = useRef<any>(null);
  const openedByHold = useRef(false);
  const touchHandled = useRef(false);
  const requestInFlight = useRef(false);
  // Scroll fix: remember where the touch started so a drag/scroll that
  // ends on the button is NOT counted as a tap (prevents auto-like).
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const TAP_SLOP_PX = 10;

  useEffect(() => {
    function onOtherOpen(e: any) {
      if (e.detail !== postId) setShowPicker(false);
    }
    window.addEventListener('reaction-picker-open', onOtherOpen);
    return () => window.removeEventListener('reaction-picker-open', onOtherOpen);
  }, [postId]);

  // Selection bounce animation trigger
  useEffect(() => {
    if (justReacted) {
      const t = setTimeout(() => setJustReacted(false), 600);
      return () => clearTimeout(t);
    }
  }, [justReacted]);

  function openPicker() {
    window.dispatchEvent(new CustomEvent('reaction-picker-open', { detail: postId }));
    setShowPicker(true);
  }

  async function apply(type: string) {
    // Debounce: ignore rapid clicks while a request is in flight
    // UI already updated optimistically, so user sees instant feedback
    if (requestInFlight.current) return;
    requestInFlight.current = true;

    playReactionSound();
    setShowPicker(false);
    setJustReacted(true);

    // Optimistic UI: update immediately, sync with server in background
    const prevReaction = myReaction;
    const prevCount = likeCount;
    const newReaction = prevReaction === type ? null : type;
    const newCount = newReaction ? (prevReaction ? prevCount : prevCount + 1) : prevCount - 1;
    onChange(newReaction, newCount);

    try {
      const result = await setReaction(postId, type);
      if (result.success) {
        // Sync with server's authoritative values
        onChange(result.data.reaction, result.data.likeCount);
      } else {
        // Revert on failure
        onChange(prevReaction, prevCount);
      }
    } catch {
      // Revert on network error
      onChange(prevReaction, prevCount);
    } finally {
      requestInFlight.current = false;
    }
  }

  function handleTap() {
    if (openedByHold.current) { openedByHold.current = false; return; }
    // Skip if touch already handled this tap (prevents double-trigger)
    if (touchHandled.current) { touchHandled.current = false; return; }
    apply(myReaction ? myReaction : 'like');
  }
  function handleTouchEnd(e: React.TouchEvent) {
    endPress();
    // Scroll fix: a release that drifted beyond tap-slop is a scroll/drag,
    // not a tap — never fire a reaction for it.
    const start = touchStartPos.current;
    touchStartPos.current = null;
    if (start) {
      const t = e.changedTouches?.[0];
      if (t) {
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (dx * dx + dy * dy > TAP_SLOP_PX * TAP_SLOP_PX) return;
      }
    }
    // If it was a tap (not a hold to open picker), handle immediately
    // This is faster than waiting for onClick on mobile
    if (!openedByHold.current && !showPicker) {
      touchHandled.current = true;
      // Call apply directly (not via handleTap, which would see touchHandled and skip)
      apply(myReaction ? myReaction : 'like');
    }
  }
  function pointFrom(e: any): { x: number; y: number } | null {
    const t = e?.touches?.[0] ?? e?.changedTouches?.[0];
    if (t) return { x: t.clientX, y: t.clientY };
    if (typeof e?.clientX === 'number') return { x: e.clientX, y: e.clientY };
    return null;
  }
  function startPress(e?: React.TouchEvent | React.MouseEvent) {
    openedByHold.current = false;
    touchStartPos.current = pointFrom(e);
    pressTimer.current = setTimeout(() => { openPicker(); openedByHold.current = true; }, HOLD_TO_OPEN_MS);
  }
  function endPress() { clearTimeout(pressTimer.current); }
  function cancelPress() { endPress(); touchStartPos.current = null; }

  const current = myReaction ? REACTIONS[myReaction] : null;
  const reactionKeys = Object.keys(REACTIONS);

  return (
    <div className="relative flex-1">
      <style>{`
        @keyframes fz-reaction-pop {
          0% { transform: scale(0) translateY(10px); opacity: 0; }
          60% { transform: scale(1.25) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes fz-reaction-select {
          0% { transform: scale(1); }
          40% { transform: scale(1.5) rotate(-8deg); }
          70% { transform: scale(0.9) rotate(4deg); }
          100% { transform: scale(1) rotate(0); }
        }
        @keyframes fz-reaction-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .fz-reaction-item {
          animation: fz-reaction-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25));
          transition: transform 0.15s ease;
        }
        .fz-reaction-item:hover {
          transform: scale(1.45) translateY(-6px) !important;
          filter: drop-shadow(0 6px 10px rgba(0,0,0,0.3));
          z-index: 10;
        }
      `}</style>
      {showPicker && (
        <div className="absolute bottom-full left-0 z-50 mb-2 flex gap-1.5 rounded-full border border-black/5 bg-white px-2.5 py-2 shadow-xl" onMouseLeave={() => { setShowPicker(false); setHovered(null); }}>
          {reactionKeys.map((key, idx) => {
            const r = REACTIONS[key];
            return (
              <div key={key} className="relative flex flex-col items-center">
                {hovered === key && (
                  <span className="absolute -top-8 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white">
                    {r.label}
                  </span>
                )}
                <button
                  onClick={() => apply(key)}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  aria-label={r.label}
                  className="fz-reaction-item"
                  style={{ animationDelay: `${idx * 45}ms` }}
                >
                  <ReactionIcon type={key} size={40} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <button
        onClick={handleTap}
        onTouchStart={startPress}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={cancelPress}
        onTouchMove={endPress}
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
        className={`flex w-full select-none items-center justify-center rounded-lg py-3 transition-transform duration-100 active:scale-90 ${current ? current.color : 'text-slate-600'}`}
      >
        {current ? (
          myReaction === 'like' ? (
            <span
              style={justReacted ? { animation: 'fz-reaction-select 0.6s ease', display: 'inline-block' } : { display: 'inline-block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
            >
              <ThumbIcon filled />
            </span>
          ) : (
            <span
              style={justReacted ? { animation: 'fz-reaction-select 0.6s ease', display: 'inline-block' } : { animation: 'fz-reaction-float 2.5s ease-in-out infinite', display: 'inline-block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
            >
              <ReactionIcon type={myReaction!} size={24} />
            </span>
          )
        ) : (
          <ThumbIcon />
        )}
      </button>
    </div>
  );
}
