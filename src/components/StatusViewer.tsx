'use client';

import { useEffect, useRef, useState } from 'react';
import { viewStatus, fetchStatusViewers, deleteStatus } from '@/lib/api/statusApi';

const ITEM_DURATION_MS = 5000;

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

export default function StatusViewer({
  groups,
  startGroupIndex,
  currentUserId,
  onClose,
  onDeleted,
}: {
  groups: any[];
  startGroupIndex: number;
  currentUserId: string;
  onClose: () => void;
  onDeleted: (statusId: string) => void;
}) {
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const viewedRef = useRef<Set<string>>(new Set());
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const group = groups[groupIndex];
  const item = group?.items?.[itemIndex];
  const isMine = group?.userId === currentUserId;

  function goNextItem() {
    if (!group) return;
    if (itemIndex < group.items.length - 1) {
      setItemIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setItemIndex(0);
    } else {
      onClose();
    }
  }
  function goPrevItem() {
    if (itemIndex > 0) {
      setItemIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((g) => g - 1);
      setItemIndex(prevGroup.items.length - 1);
    }
  }

  // Progress timer for the current item — pauses on long-press.
  useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    if (paused) return;
    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = elapsedRef.current + (now - startRef.current);
      const pct = Math.min(1, elapsed / ITEM_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) {
        goNextItem();
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, itemIndex, paused]);

  function pause() {
    cancelAnimationFrame(frameRef.current);
    elapsedRef.current += performance.now() - startRef.current;
    setPaused(true);
  }
  function resume() {
    setPaused(false);
  }

  // Mark each item viewed once, the moment it's shown.
  useEffect(() => {
    if (!item || isMine || viewedRef.current.has(item.id)) return;
    viewedRef.current.add(item.id);
    viewStatus(item.id);
  }, [item, isMine]);

  async function openViewers() {
    if (!item) return;
    pause();
    setViewersOpen(true);
    const result = await fetchStatusViewers(item.id);
    if (result.success) setViewers(result.data.viewers);
  }

  async function handleDelete() {
    if (!item || !confirm('Delete this status?')) return;
    const result = await deleteStatus(item.id);
    if (result.success) {
      onDeleted(item.id);
      goNextItem();
    }
  }

  if (!group || !item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-xl flex-col">
        {/* Progress bars */}
        <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
          {group.items.map((it: any, i: number) => (
            <div key={it.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{ width: i < itemIndex ? '100%' : i === itemIndex ? `${progress * 100}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute left-0 right-0 top-4 z-10 flex items-center justify-between px-3 pt-2">
          <div className="flex items-center gap-2">
            <span
              className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-slate-600 bg-cover bg-center"
              style={group.user?.profilePictureUrl ? { backgroundImage: `url(${group.user.profilePictureUrl})` } : {}}
            />
            <span className="text-sm font-medium text-white">{isMine ? 'Your status' : group.user?.displayName}</span>
            <span className="text-xs text-white/60">{timeAgo(item.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3">
            {isMine && (
              <button onClick={handleDelete} className="text-white/80" aria-label="Delete">
                <TrashIcon />
              </button>
            )}
            <button onClick={onClose} className="text-white" aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex flex-1 items-center justify-center"
          style={{ backgroundColor: item.mediaType === 'text' ? item.bgColor || '#1e293b' : '#000' }}
          onMouseDown={pause}
          onMouseUp={resume}
          onTouchStart={pause}
          onTouchEnd={resume}
          onClick={(e) => {
            const x = e.clientX;
            const width = (e.currentTarget as HTMLDivElement).clientWidth;
            if (x < width / 3) goPrevItem();
            else goNextItem();
          }}
        >
          {item.mediaType === 'text' ? (
            <p className="max-w-[85%] whitespace-pre-wrap break-words text-center text-2xl font-semibold text-white">
              {item.textContent}
            </p>
          ) : item.mediaType === 'video' ? (
            <video src={item.mediaUrl} autoPlay muted playsInline className="max-h-full max-w-full object-contain" />
          ) : (
            <img src={item.mediaUrl} alt="" className="max-h-full max-w-full object-contain" />
          )}
        </div>

        {/* Viewers (own status only) */}
        {isMine && (
          <button
            onClick={openViewers}
            className="absolute bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-1.5 text-sm text-white/80"
          >
            <EyeIcon />
            Viewers
          </button>
        )}

        {viewersOpen && (
          <div
            className="absolute inset-0 z-20 flex items-end justify-center bg-black/50"
            onClick={() => {
              setViewersOpen(false);
              resume();
            }}
          >
            <div
              className="max-h-[60vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-3 text-center text-sm font-semibold text-slate-800">
                {viewers.length} {viewers.length === 1 ? 'view' : 'views'}
              </p>
              {viewers.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No views yet.</p>
              ) : (
                <div className="divide-y">
                  {viewers.map((v: any) => (
                    <div key={v.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 bg-cover bg-center"
                        style={v.profilePictureUrl ? { backgroundImage: `url(${v.profilePictureUrl})` } : {}}
                      />
                      <span className="text-sm text-slate-800">{v.displayName || v.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
