'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [trimApplied, setTrimApplied] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [timelineThumbnails, setTimelineThumbnails] = useState<string[]>([]);
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);
  const [trimming, setTrimming] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const thumbnailCacheRef = useRef<{ url: string; duration: number; frames: string[] } | null>(null);

  useEffect(() => {
    const pending = takePendingReelVideo();
    if (!pending) {
      router.replace('/reels');
      return;
    }
    setFile(pending.file);
    setDuration(pending.duration);
    setTrimStart(0);
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

  useEffect(() => {
    if (!draggingHandle) return;

    function onPointerMove(event: PointerEvent) {
      const track = timelineRef.current;
      if (!track || !videoDuration) return;

      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const time = ratio * videoDuration;

      if (draggingHandle === 'start') {
        const next = Math.min(time, trimEnd - 0.1);
        setTrimStart(next);
        if (videoRef.current) { videoRef.current.currentTime = next; videoRef.current.play().catch(() => {}); }
      } else {
        const next = Math.max(time, trimStart + 0.1);
        setTrimEnd(next);
        if (videoRef.current) videoRef.current.currentTime = next;
      }
    }

    function onPointerUp() {
      setDraggingHandle(null);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggingHandle, trimStart, trimEnd, videoDuration]);

  useEffect(() => {
    if (!previewUrl || !videoDuration) return;

    const cached = thumbnailCacheRef.current;
    if (cached?.url === previewUrl && cached.duration === videoDuration && cached.frames.length) {
      setTimelineThumbnails(cached.frames);
      return;
    }

    let cancelled = false;
    const thumbnailCount = 14;
    const video = document.createElement('video');
    video.src = previewUrl;
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const createThumbnails = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error('Unable to load video thumbnails'));
        });

        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const frames: string[] = [];
        for (let index = 0; index < thumbnailCount; index += 1) {
          if (cancelled) return;
          const target = video.duration * ((index + 0.5) / thumbnailCount);
          await new Promise<void>((resolve) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resolve();
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = Math.min(target, Math.max(0, video.duration - 0.01));
          });
          ctx.drawImage(video, 0, 0, 96, 64);
          frames.push(canvas.toDataURL('image/jpeg', 0.68));
          if (!cancelled) setTimelineThumbnails([...frames]);
        }

        if (!cancelled) {
          thumbnailCacheRef.current = { url: previewUrl, duration: videoDuration, frames };
          setTimelineThumbnails(frames);
        }
      } catch {
        // Keep any thumbnails already generated.
      }
    };

    createThumbnails();
    return () => {
      cancelled = true;
      video.removeAttribute('src');
      video.load();
    };
  }, [previewUrl, videoDuration]);

  const selectedDuration = Math.max(1, Math.round(trimEnd - trimStart));
  const playheadTime = Math.max(trimStart, Math.min(currentTime, trimEnd));
  const playheadPercent = videoDuration ? (playheadTime / videoDuration) * 100 : 0; 

  // Keep trim preview playback simple: only loop when the selected end is reached.
  // Do not continuously clamp currentTime in an effect; that fights the native video controls
  // and causes playback to pause/glitch while the user is dragging the handles.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (!trimApplied && !trimOpen) return;
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
        video.play().catch(() => {});
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [trimOpen, trimStart, trimEnd]);
  const startPercent = videoDuration ? (trimStart / videoDuration) * 100 : 0;
  const endPercent = videoDuration ? (trimEnd / videoDuration) * 100 : 100;

  function moveHandleToClientX(kind: 'start' | 'end', clientX: number) {
    const track = timelineRef.current;
    if (!track || !videoDuration) return;

    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = ratio * videoDuration;

    if (kind === 'start') {
      const next = Math.min(time, trimEnd - 0.1);
      setTrimStart(next);
      if (videoRef.current) { videoRef.current.currentTime = next; videoRef.current.play().catch(() => {}); }
    } else {
      const next = Math.max(time, trimStart + 0.1);
      setTrimEnd(next);
      if (videoRef.current) { videoRef.current.currentTime = next; videoRef.current.play().catch(() => {}); }
    }
  }

  function handleTimelinePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (draggingHandle || !videoDuration) return;
    const target = event.target as HTMLElement;
    if (target.closest('[data-trim-handle]')) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const time = ratio * videoDuration;
    const distanceToStart = Math.abs(time - trimStart);
    const distanceToEnd = Math.abs(time - trimEnd);

    moveHandleToClientX(distanceToStart <= distanceToEnd ? 'start' : 'end', event.clientX);
  }

  async function handlePost() {
    if (!file || posting || trimEnd <= trimStart) return;
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

    if (result.success) {
      router.replace('/reels');
    } else {
      alert(result.error?.message || 'Could not post your reel. Please try again.');
    }
  }

  function openTrim() {
    if (!videoDuration) return;
    setTrimOpen(true);
  }

  async function applyTrim() {
    if (!file || trimming) return;

    const start = Math.max(0, Math.min(trimStart, videoDuration - 0.1));
    const end = Math.max(start + 0.1, Math.min(trimEnd, videoDuration));

    if (start <= 0.05 && end >= videoDuration - 0.05) {
      setTrimStart(0);
      setTrimEnd(videoDuration);
      setDuration(Math.round(videoDuration));
      setTrimApplied(false);
      setTrimOpen(false);
      return;
    }

    const sourceVideo = videoRef.current;
    if (!sourceVideo || !('captureStream' in HTMLVideoElement.prototype) || typeof MediaRecorder === 'undefined') {
      alert('Trim is not supported on this browser.');
      return;
    }

    setTrimming(true);
    sourceVideo.pause();

    try {
      sourceVideo.currentTime = start;
      await new Promise<void>((resolve, reject) => {
        const onSeeked = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error('Could not seek video')); };
        const cleanup = () => {
          sourceVideo.removeEventListener('seeked', onSeeked);
          sourceVideo.removeEventListener('error', onError);
        };
        sourceVideo.addEventListener('seeked', onSeeked);
        sourceVideo.addEventListener('error', onError);
      });

      const captureStream = (sourceVideo as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream;
      if (typeof captureStream !== 'function') throw new Error('Trim is not supported on this browser.');
      const stream = captureStream.call(sourceVideo);
      const mimeTypes = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';
      if (!mimeType) throw new Error('No supported recording format');

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType });

      const finished = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onerror = () => reject(new Error('Could not create trimmed video'));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      recorder.start(250);
      await sourceVideo.play();

      await new Promise<void>((resolve) => {
        const check = () => {
          if (sourceVideo.currentTime >= end) {
            sourceVideo.pause();
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      });

      if (recorder.state === 'recording') recorder.stop();
      const blob = await finished;
      stream.getTracks().forEach((track) => track.stop());

      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const trimmedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, '') + '-trimmed.' + extension,
        { type: mimeType }
      );

      const nextUrl = URL.createObjectURL(trimmedFile);
      setFile(trimmedFile);
      setPreviewUrl(nextUrl);
      setVideoDuration(end - start);
      setTrimStart(0);
      setTrimEnd(end - start);
      setDuration(Math.round(end - start));
      setCurrentTime(0);
      setTrimApplied(false);
      setTrimOpen(false);
      thumbnailCacheRef.current = null;
      setTimelineThumbnails([]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not trim video.');
    } finally {
      setTrimming(false);
    }
  }

  function resetTrim() {
    setTrimStart(0);
    setTrimEnd(videoDuration);
    setDuration(Math.round(videoDuration));
    setTrimApplied(false);
    if (videoRef.current) videoRef.current.currentTime = 0;
  }

  if (!file || !previewUrl) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="relative flex h-20 w-20 items-center justify-center" role="status" aria-label="Loading Frianzo">
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <img src="/logo.png" alt="Frianzo" className="h-12 w-12 object-contain" />
        </div>
      </div>
    );
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
          disabled={posting || trimming || trimEnd <= trimStart}
          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
        >
          {posting ? `${uploadProgress ?? 0}%` : 'Post'}
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-4">
        <video
          ref={videoRef}
          key={previewUrl}
          src={previewUrl}
          controls
          className="max-h-full max-w-full rounded-lg bg-black"
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const d = Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : duration;
            if (d > 0) {
              setVideoDuration(d);
              setTrimEnd((current) => current || d);
            }
          }}
        />
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

        <div className="flex items-center gap-4 border-t border-white/10 pt-3">
          <button onClick={openTrim} disabled={trimming} className="flex flex-col items-center gap-1 text-xs text-white disabled:opacity-50">
            <TrimIcon />
            Trim
          </button>
          <button disabled className="flex flex-col items-center gap-1 text-xs text-white/40">
            <EffectsIcon />
            Effects
          </button>
          <button disabled className="flex flex-col items-center gap-1 text-xs text-white/40">
            <MusicIcon />
            Music
          </button>
          <span className="ml-auto text-[11px] text-white/50">{selectedDuration}s selected</span>
        </div>
      </div>

      {trimOpen && (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-white/10 bg-neutral-950 p-4 pb-6 shadow-2xl">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Trim video</p>
            </div>
            <button onClick={() => setTrimOpen(false)} disabled={trimming} className="text-xs text-white/60 disabled:opacity-40">Cancel</button>
          </div>

          <div
            ref={timelineRef}
            onPointerDown={handleTimelinePointerDown}
            className="relative h-16 touch-none select-none"
            aria-label="Video trim timeline"
          >
            <div className="absolute inset-x-0 top-6 h-8 overflow-hidden rounded-lg border border-white/10 bg-white/5">
              <div className="absolute inset-0 flex overflow-hidden rounded-lg bg-black">
                {(timelineThumbnails.length ? timelineThumbnails : Array.from({ length: 14 }, () => '')) .map((thumbnail, index) => (
                  thumbnail ? (
                    <img
                      key={index}
                      src={thumbnail}
                      alt=""
                      draggable={false}
                      className="h-full min-w-0 flex-1 object-cover"
                    />
                  ) : (
                    <div key={index} className="h-full min-w-0 flex-1 bg-white/10" />
                  )
                ))}
              </div>
            </div>

            <div
              className="pointer-events-none absolute top-5 h-10 rounded-lg border-2 border-blue-500 bg-blue-500/10"
              style={{ left: `${startPercent}%`, width: `${Math.max(0, endPercent - startPercent)}%` }}
            />

            <div
              className="pointer-events-none absolute top-1 z-[5] h-14 w-0.5 bg-white shadow-[0_0_5px_rgba(0,0,0,0.8)]"
              style={{ left: `${playheadPercent}%` }}
              aria-hidden="true"
            >
              <span className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-white" />
            </div>

            <button
              type="button"
              data-trim-handle="start"
              aria-label="Trim start"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!trimming) setDraggingHandle('start');
              }}
              className="absolute top-2 z-10 flex h-16 w-7 -translate-x-1/2 items-center justify-center rounded-md bg-blue-500 shadow-lg shadow-blue-500/20"
              style={{ left: `${startPercent}%` }}
            >
              <span className="h-8 w-1 rounded-full bg-white" />
            </button>

            <button
              type="button"
              data-trim-handle="end"
              aria-label="Trim end"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!trimming) setDraggingHandle('end');
              }}
              className="absolute top-2 z-10 flex h-16 w-7 -translate-x-1/2 items-center justify-center rounded-md bg-blue-500 shadow-lg shadow-blue-500/20"
              style={{ left: `${endPercent}%` }}
            >
              <span className="h-8 w-1 rounded-full bg-white" />
            </button>

            <div className="pointer-events-none absolute inset-x-0 top-[58px] flex items-start justify-between px-0.5 text-[10px] text-white/50">
              {(() => {
                const totalSeconds = Math.max(0, Math.floor(videoDuration));
                const step = totalSeconds <= 30
                  ? 5
                  : totalSeconds <= 60
                    ? 10
                    : totalSeconds <= 180
                      ? 20
                      : totalSeconds <= 600
                        ? 60
                        : Math.ceil(totalSeconds / 6 / 10) * 10;

                const labels: number[] = [];
                for (let second = 0; second <= totalSeconds; second += step) {
                  labels.push(second);
                }
                if (labels[labels.length - 1] !== totalSeconds) labels.push(totalSeconds);

                return labels.map((second, index) => {
                  const minutes = Math.floor(second / 60);
                  const seconds = second % 60;

                  return (
                    <span key={index} className="min-w-0 text-center leading-tight whitespace-nowrap">
                      {second < 60 ? (
                        `${second}s`
                      ) : seconds === 0 ? (
                        `${minutes}m`
                      ) : (
                        <>
                          <span className="block">{minutes}m</span>
                          <span className="block">{seconds}s</span>
                        </>
                      )}
                    </span>
                  );
                });
              })()}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={resetTrim} disabled={trimming} className="flex-1 rounded-lg border border-white/15 py-2 text-sm text-white disabled:opacity-40">
              Reset
            </button>
            <button onClick={applyTrim} disabled={trimming} className="flex-1 rounded-lg bg-white py-2 text-sm font-semibold text-black disabled:opacity-50">
              {trimming ? 'Processing…' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
