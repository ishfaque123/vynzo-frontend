'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchVideoGenStatus, startVideoGeneration, checkVideoOperation } from '@/lib/api/videoGenApi';
import { setPendingReelVideo } from '@/lib/pendingReelVideo';
import Toast from '@/components/Toast';

function BackIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function SparklesIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" /></svg>;
}
function DownloadIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>;
}
function ReelIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></svg>;
}

type Phase = 'idle' | 'generating' | 'done' | 'error';

export default function AiVideoPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [durationSeconds, setDurationSeconds] = useState<4 | 8>(8);
  const [phase, setPhase] = useState<Phase>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchVideoGenStatus().then((r: any) => {
      setEnabled(r?.success ? !!r.data?.enabled : false);
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleGenerate = async () => {
    const p = prompt.trim();
    if (p.length < 3) {
      setToast({ message: 'Please describe your video (min 3 characters).', type: 'error' });
      return;
    }
    if (p.length > 500) {
      setToast({ message: 'Prompt is too long (max 500 characters).', type: 'error' });
      return;
    }
    setPhase('generating');
    setVideoUrl(null);
    setErrorMsg('');
    setElapsed(0);

    const start = await startVideoGeneration(p, aspectRatio, durationSeconds);
    if (!start?.success || !start.data?.operationName) {
      setPhase('error');
      const rawError = start?.error?.message || 'Failed to start generation.';
      setErrorMsg(rawError === 'PREMIUM_REQUIRED' ? 'PREMIUM_REQUIRED' : rawError);
      return;
    }

    const opName: string = start.data.operationName;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    pollRef.current = setInterval(async () => {
      const status = await checkVideoOperation(opName);
      if (!status?.success) return;
      const d = status.data;
      if (d?.done) {
        stopPolling();
        if (d.videoUrl) {
          setVideoUrl(d.videoUrl);
          setPhase('done');
        } else {
          setPhase('error');
          setErrorMsg(d.error || 'Generation finished but no video was returned.');
        }
      } else if (d?.error) {
        stopPolling();
        setPhase('error');
        setErrorMsg(d.error);
      }
    }, 5000);

    setTimeout(() => {
      if (pollRef.current) {
        stopPolling();
        setPhase('error');
        setErrorMsg('Generation timed out. Please try again.');
      }
    }, 6 * 60 * 1000);
  };

  const handleDownload = async () => {
    if (!videoUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frianzo-ai-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast({ message: 'Video downloaded.', type: 'success' });
    } catch {
      setToast({ message: 'Download failed. Try again.', type: 'error' });
    }
    setDownloading(false);
  };

  const handlePostAsReel = async () => {
    if (!videoUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const file = new File([blob], `ai-video-${Date.now()}.mp4`, { type: 'video/mp4' });
      setPendingReelVideo(file, durationSeconds);
      router.push('/reels/new');
    } catch {
      setToast({ message: 'Could not load video. Try again.', type: 'error' });
      setDownloading(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    setPhase('idle');
    setVideoUrl(null);
    setErrorMsg('');
    setElapsed(0);
  };

  const formatElapsed = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => router.back()} aria-label="Back" className="p-2 text-slate-900">
          <BackIcon />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-violet-600"><SparklesIcon /></span>
          <h1 className="text-lg font-bold text-slate-900">AI Video Generator</h1>
        </div>
      </div>

      {enabled === false && (
        <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          AI video generation is not available right now. Please try again later.
        </div>
      )}

      {phase !== 'generating' && phase !== 'done' && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Describe your video
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cinematic sunset over mountains, birds flying..."
            rows={4}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:border-violet-500"
          />
          <div className="mt-1 text-right text-xs text-slate-400">{prompt.length}/500</div>

          <div className="mt-3">
            <div className="mb-2 text-sm font-semibold text-slate-700">Format</div>
            <div className="flex gap-2">
              {(['9:16', '16:9'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    aspectRatio === r
                      ? 'border-violet-600 bg-violet-50 text-violet-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {r === '9:16' ? 'Portrait (Reel)' : 'Landscape'}
                  <span className="block text-xs font-normal opacity-70">{r}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-2 text-sm font-semibold text-slate-700">Duration</div>
            <div className="flex gap-2">
              {([4, 8] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationSeconds(d)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    durationSeconds === d
                      ? 'border-violet-600 bg-violet-50 text-violet-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {d} seconds
                </button>
              ))}
            </div>
          </div>

          {phase === 'error' && (
            errorMsg === 'PREMIUM_REQUIRED' ? (
              <div className="mt-3 rounded-xl bg-violet-50 p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <SparklesIcon />
                </div>
                <p className="font-semibold text-violet-900">Premium Feature</p>
                <p className="mt-1 text-sm text-violet-700">
                  This feature is only available for Premium users.
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errorMsg}</div>
            )
          )}

          <button
            onClick={handleGenerate}
            disabled={enabled === false}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            <SparklesIcon />
            {phase === 'error' ? 'Try Again' : 'Generate Video'}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Generation usually takes 1–3 minutes.
          </p>
        </div>
      )}

      {phase === 'generating' && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          <h2 className="font-semibold text-slate-900">Creating your video...</h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatElapsed(elapsed)} elapsed — this can take a few minutes.
          </p>
          <p className="mt-2 line-clamp-2 text-xs text-slate-400">&ldquo;{prompt}&rdquo;</p>
          <button
            onClick={handleReset}
            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
          >
            Cancel
          </button>
        </div>
      )}

      {phase === 'done' && videoUrl && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <video
            src={videoUrl}
            controls
            playsInline
            className={`w-full rounded-xl bg-black ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <DownloadIcon />
              {downloading ? 'Loading...' : 'Download'}
            </button>
            <button
              onClick={handlePostAsReel}
              disabled={downloading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              <ReelIcon />
              Post as Reel
            </button>
          </div>
          <button
            onClick={handleReset}
            className="mt-2 w-full rounded-xl px-4 py-2 text-sm font-medium text-violet-600"
          >
            Generate another
          </button>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
