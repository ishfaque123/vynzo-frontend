'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  discardPendingPostUpload,
  getPendingPostUpload,
  retryPendingPostUpload,
  subscribePendingPostUpload,
} from '@/lib/pendingPostUpload';

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><polyline points="8.5 12.5 11 15 15.5 9.5" />
    </svg>
  );
}

// Slim bottom bar for the background post upload held in
// lib/pendingPostUpload. Rendered by Shell, so it stays on screen
// across client-side navigation after the composer has closed:
// progress while posting, a short confirmation once published, and
// Retry / Discard after a failure (the composed text and photo are
// still held in memory, so Retry loses nothing).
export default function PostingBar() {
  const upload = useSyncExternalStore(
    subscribePendingPostUpload,
    getPendingPostUpload,
    () => null,
  );
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The published confirmation shows briefly, then the bar clears
  // itself. The new post is already at the top of the feed by then.
  useEffect(() => {
    if (upload?.status !== 'published') return;
    hideTimerRef.current = setTimeout(() => discardPendingPostUpload(), 4000);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [upload?.status]);

  if (!upload) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4">
      <div className="pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl">
        {upload.imagePreviewUrl && (
          <img src={upload.imagePreviewUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        )}
        {upload.status === 'posting' && (
          <>
            <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" role="status" aria-label="Posting" />
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">Posting...</p>
            <span className="shrink-0 text-sm font-medium text-slate-500">{upload.progress}%</span>
          </>
        )}
        {upload.status === 'published' && (
          <>
            <span className="shrink-0 text-green-600"><CheckIcon /></span>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">Your post has been published</p>
          </>
        )}
        {upload.status === 'failed' && (
          <>
            <p className="min-w-0 flex-1 text-sm font-medium text-red-600">{upload.error || 'Failed to create post'}</p>
            <button onClick={retryPendingPostUpload} className="shrink-0 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white">Retry</button>
            <button onClick={discardPendingPostUpload} className="shrink-0 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700">Discard</button>
          </>
        )}
      </div>
    </div>
  );
}
