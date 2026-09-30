'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { takePendingReelVideo } from '@/lib/pendingReelVideo';
import { createReelWithProgress } from '@/lib/api/reelApi';

function CloseIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function TrimIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>;
}
function EffectsIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6l-6.3 4.4 2.3-7.2-6-4.4h7.6z" /></svg>;
}
function MusicIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
}

export default function NewReelPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [trimOpen, setTrimOpen] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    const pending = takePendingReelVideo();
    if (!pending) {
      router.replace('/reels');
      return;
    }
    setFile(pending.file);
    setDuration(pending.duration);
    setTrimEnd(pending.duration);
    setVideoDuration(pending.duration);
    setPreviewUrl(URL.createObjectURL(pending.file));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectedDuration = Math.max(1, Math.round(trimEnd - trimStart));

  async function handlePost() {
    if (!file || posting) return;
    if (trimEnd <= trimStart) return;
    setPosting(true);
    setUploadProgress(0);
    const trimChanged = trimStart > 0.05 || trimEnd < videoDuration - 0.05;
    const result = await createReelWithProgress(
      {
        video: file,
        caption: caption.trim() || undefined,
        durationSec: selectedDuration,
        ...(trimChanged ? { trimStartSec: trimStart, trimEndSec: trimEnd } : {}),
      },
      setUploadProgress
    );
    setPosting(false);
    setUploadProgress(null);
    if (result.success) router.replace('/reels');
    else alert(result.error?.message || 'Could not post your reel. Please try again.');
  }

  function openTrim() {
    if (!videoDuration) return;
    setTrimOpen(true);
  }

  function applyTrim() {
    const start = Math.max(0, Math.min(trimStart, videoDuration - 1));
    const end = Math.max(start + 1, Math.min(trimEnd, videoDuration));
    setTrimStart(start);
    setTrimEnd(end);
    setDuration(Math.round(end - start));
    setTrimOpen(false);
  }

  function resetTrim() {
    setTrimStart(0);
    setTrimEnd(videoDuration);
    setDuration(Math.round(videoDuration));
  }

  if (!file || !previewUrl) {
    return <div className="fixed inset-0 flex items-center justify-center bg-black"><div className="relative flex h-20 w-20 items-center justify-center" role="status" aria-label="Loading Frianzo"><span className="absolute inset-0 animate-spin rounded-full border-4 border-white/20 border-t-white" /><img src="/logo.png" alt="Frianzo" className="h-12 w-12 object-contain" /></div></div>;
  }

  const startPercent = videoDuration ? (trimStart / videoDuration) * 100 : 0;
  const endPercent = videoDuration ? (trimEnd / videoDuration) * 100 : 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => router.replace('/reels')} className="text-white" aria-label="Cancel"><CloseIcon /></button>
        <p className="text-base font-semibold text-white">New Reel</p>
        <button onClick={handlePost} disabled={posting || trimEnd <= trimStart} className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-50">
          {posting ? `${uploadProgress ?? 0}%` : 'Post'}
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-4">
        <video
          key={previewUrl}
          src={previewUrl}
          controls
          className="max-h-full max-w-full rounded-lg bg-black"
          onLoadedMetadata={(e) => {
            const d = Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : duration;
            if (d > 0) {
              setVideoDuration(d);
              if (trimEnd === 0) setTrimEnd(d);
            }
          }}
        />
      </div>

      <div className="space-y-3 p-4">
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption" rows={2} maxLength={500} className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 outline-none" />

        {uploadProgress !== null && <div className="h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${uploadProgress}%` }} /></div>}

        <div className="flex items-center gap-4 border-t border-white/10 pt-3 text-white/40">
          <button onClick={openTrim} className="flex flex-col items-center gap-1 text-xs text-white"><TrimIcon />Trim</button>
          <button disabled className="flex flex-col items-center gap-1 text-xs"><EffectsIcon />Effects</button>
          <button disabled className="flex flex-col items-center gap-1 text-xs"><MusicIcon />Music</button>
          <span className="ml-auto text-[11px] text-white/30">{selectedDuration}s</span>
        </div>
      </div>

      {trimOpen && (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-white/10 bg-neutral-950 p-4 pb-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div><p className="text-sm font-semibold text-white">Trim video</p><p className="text-xs text-white/50">Choose the part you want to post</p></div>
            <button onClick={() => setTrimOpen(false)} className="text-xs text-white/60">Cancel</button>
          </div>
          <div className="relative h-10">
            <div className="absolute left-0 right-0 top-4 h-2 rounded-full bg-white/15" />
            <div className="absolute top-4 h-2 rounded-full bg-blue-500" style={{ left: `${startPercent}%`, right: `${100 - endPercent}%` }} />
            <input aria-label="Trim start" type="range" min="0" max={videoDuration} step="0.1" value={trimStart} onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 0.1))} className="absolute inset-0 w-full appearance-none bg-transparent accent-blue-500" />
            <input aria-label="Trim end" type="range" min="0" max={videoDuration} step="0.1" value={trimEnd} onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 0.1))} className="absolute inset-0 w-full appearance-none bg-transparent accent-blue-500" />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/60"><span>{trimStart.toFixed(1)}s</span><span>{selectedDuration}s selected</span><span>{trimEnd.toFixed(1)}s</span></div>
          <div className="mt-4 flex gap-2">
            <button onClick={resetTrim} className="flex-1 rounded-lg border border-white/15 py-2 text-sm text-white">Reset</button>
            <button onClick={applyTrim} className="flex-1 rounded-lg bg-white py-2 text-sm font-semibold text-black">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
