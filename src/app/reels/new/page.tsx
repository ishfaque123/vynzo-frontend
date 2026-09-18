'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { takePendingReelVideo } from '@/lib/pendingReelVideo';
import { createReelWithProgress } from '@/lib/api/reelApi';

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function TrimIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}
function EffectsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6l-6.3 4.4 2.3-7.2-6-4.4h7.6z" />
    </svg>
  );
}
function MusicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export default function NewReelPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    const pending = takePendingReelVideo();
    if (!pending) {
      router.replace('/reels');
      return;
    }
    setFile(pending.file);
    setDuration(pending.duration);
    setPreviewUrl(URL.createObjectURL(pending.file));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handlePost() {
    if (!file || posting) return;
    setPosting(true);
    setUploadProgress(0);
    const result = await createReelWithProgress(
      { video: file, caption: caption.trim() || undefined, durationSec: duration },
      setUploadProgress
    );
    setPosting(false);
    setUploadProgress(null);
    if (result.success) {
      router.replace('/reels');
    } else {
      alert(result.error?.message || 'Could not post your reel. Please try again.');
    }
  }

  if (!file || !previewUrl) {
    return <div className="fixed inset-0 flex items-center justify-center bg-black"><div className="relative flex h-20 w-20 items-center justify-center" role="status" aria-label="Loading Frianzo"><span className="absolute inset-0 animate-spin rounded-full border-4 border-white/20 border-t-white" /><img src="/logo.png" alt="Frianzo" className="h-12 w-12 object-contain" /></div></div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => router.replace('/reels')} className="text-white" aria-label="Cancel">
          <CloseIcon />
        </button>
        <p className="text-base font-semibold text-white">New Reel</p>
        <button
          onClick={handlePost}
          disabled={posting}
          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
        >
          {posting ? `${uploadProgress ?? 0}%` : 'Post'}
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-4">
        <video src={previewUrl} controls className="max-h-full max-w-full rounded-lg bg-black" />
      </div>

      <div className="space-y-3 p-4">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption"
          rows={2}
          maxLength={500}
          className="w-full resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 outline-none"
        />

        {uploadProgress !== null && (
          <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {/* Editing tools — reserved for a future update (trim, effects, music). */}
        <div className="flex items-center gap-4 border-t border-white/10 pt-3 text-white/40">
          <button disabled className="flex flex-col items-center gap-1 text-xs">
            <TrimIcon />
            Trim
          </button>
          <button disabled className="flex flex-col items-center gap-1 text-xs">
            <EffectsIcon />
            Effects
          </button>
          <button disabled className="flex flex-col items-center gap-1 text-xs">
            <MusicIcon />
            Music
          </button>
          <span className="ml-auto text-[11px] text-white/30">Coming soon</span>
        </div>
      </div>
    </div>
  );
}
