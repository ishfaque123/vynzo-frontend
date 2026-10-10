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
function CoverIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4.5 17.5l4.5-4.5 3 3 3.5-3.5 4 4" /></svg>;
}

const MIN_TRIM_DURATION = 1;

const REEL_FILTERS = [
  { id: 'normal', name: 'Normal', css: '' },
  { id: 'warm', name: 'Warm', css: 'sepia(0.25) saturate(1.3) contrast(1.05) brightness(1.03)' },
  { id: 'cool', name: 'Cool', css: 'saturate(1.15) contrast(1.05) brightness(1.02) hue-rotate(-10deg)' },
  { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.4) saturate(0.8) contrast(0.95) brightness(1.02)' },
  { id: 'vivid', name: 'Vivid', css: 'saturate(1.5) contrast(1.12) brightness(1.01)' },
];

function formatTrimTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
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
  const [trimPlaying, setTrimPlaying] = useState(false);
  const trimSnapshotRef = useRef<{ start: number; end: number } | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [postTrimProcessing, setPostTrimProcessing] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [capturingCover, setCapturingCover] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState('normal');
  const [filterThumb, setFilterThumb] = useState<string | null>(null);
  const activeFilterCss = (REEL_FILTERS.find((f) => f.id === filter) || REEL_FILTERS[0]).css;
  useEffect(() => {
    if (!filterOpen || filterThumb) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * 120));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setFilterThumb(canvas.toDataURL('image/jpeg', 0.7));
    } catch { /* ignore */ }
  }, [filterOpen, filterThumb]);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const thumbnailCacheRef = useRef<{ url: string; duration: number; frames: string[] } | null>(null);
  const coverUrlRef = useRef<string | null>(null);

  useEffect(() => {
    coverUrlRef.current = coverPreviewUrl;
  }, [coverPreviewUrl]);

  useEffect(() => {
    return () => {
      if (coverUrlRef.current) URL.revokeObjectURL(coverUrlRef.current);
    };
  }, []);

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
    setPreviewError(false);
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
        const next = Math.min(time, trimEnd - MIN_TRIM_DURATION);
        setTrimStart(next);
        if (videoRef.current) videoRef.current.currentTime = next;
      } else {
        const next = Math.max(time, trimStart + MIN_TRIM_DURATION);
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

  const selectedDuration = Math.max(MIN_TRIM_DURATION, Math.round(trimEnd - trimStart));
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
        video.play().then(() => setTrimPlaying(true)).catch(() => {});
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
      const next = Math.min(time, trimEnd - MIN_TRIM_DURATION);
      setTrimStart(next);
      if (videoRef.current) { videoRef.current.currentTime = next; videoRef.current.play().catch(() => {}); }
    } else {
      const next = Math.max(time, trimStart + MIN_TRIM_DURATION);
      setTrimEnd(next);
      if (videoRef.current) { videoRef.current.currentTime = next; videoRef.current.play().catch(() => {}); }
    }
  }

  function handleTimelinePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (draggingHandle || !videoDuration || trimming) return;
    const target = event.target as HTMLElement;
    if (target.closest('[data-trim-handle]')) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || !videoRef.current) return;

    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const time = ratio * videoDuration;
    const nextTime = Math.max(trimStart, Math.min(time, trimEnd));
    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
    videoRef.current.play().catch(() => {});
    setTrimPlaying(true);
  }

  async function handlePost() {
    if (!file || posting || trimEnd <= trimStart) return;
    setPosting(true);
    setUploadProgress(0);

    const trimChanged = trimStart > 0.05 || trimEnd < videoDuration - 0.05;
    setPostTrimProcessing(trimChanged);
    const result = await createReelWithProgress(
      {
        video: file,
        ...(coverBlob ? { cover: coverBlob } : {}),
        caption: caption.trim() || undefined,
        durationSec: selectedDuration,
        ...(trimChanged ? { trimStartSec: trimStart, trimEndSec: trimEnd } : {}),
        ...(filter !== 'normal' ? { filter } : {}),
      },
      setUploadProgress
    );

    setPosting(false);
    setUploadProgress(null);
    setPostTrimProcessing(false);

    if (result.success) {
      router.replace('/reels');
    } else {
      alert(result.error?.message || 'Could not post your reel. Please try again.');
    }
  }

  async function captureCover(index: number) {
    if (!previewUrl || capturingCover) return;
    setCapturingCover(true);
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'auto';
      video.src = previewUrl;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('cover capture failed'));
      });
      // Map the frame into the trimmed range so the cover always matches the final video.
      const trimChanged = trimStart > 0.05 || trimEnd < videoDuration - 0.05;
      const rangeStart = trimChanged ? trimStart : 0;
      const rangeEnd = trimChanged ? trimEnd : video.duration;
      const target = rangeStart + (rangeEnd - rangeStart) * ((index + 0.5) / 14);
      await new Promise<void>((resolve) => {
        const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve(); };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = Math.min(target, Math.max(0, video.duration - 0.01));
      });
      const outWidth = 540;
      const scale = outWidth / (video.videoWidth || outWidth);
      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = Math.max(1, Math.round((video.videoHeight || outWidth) * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no canvas context');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      if (!blob) throw new Error('toBlob failed');
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
      setCoverBlob(blob);
      setCoverPreviewUrl(URL.createObjectURL(blob));
    } catch {
      const dataUrl = timelineThumbnails[index];
      if (dataUrl) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
          setCoverBlob(blob);
          setCoverPreviewUrl(URL.createObjectURL(blob));
        } catch { /* keep previous cover */ }
      }
    } finally {
      setCapturingCover(false);
      setCoverOpen(false);
    }
  }

  function openTrim() {
    if (!videoDuration) return;
    trimSnapshotRef.current = { start: trimStart, end: trimEnd };
    setTrimOpen(true);
    setTrimPlaying(!videoRef.current?.paused);
  }

  function cancelTrim() {
    if (trimming) return;
    const snapshot = trimSnapshotRef.current;
    if (snapshot) {
      setTrimStart(snapshot.start);
      setTrimEnd(snapshot.end);
      setCurrentTime(Math.max(snapshot.start, Math.min(currentTime, snapshot.end)));
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(snapshot.start, Math.min(videoRef.current.currentTime, snapshot.end));
      }
    }
    trimSnapshotRef.current = null;
    setTrimPlaying(false);
    setTrimOpen(false);
  }

  function toggleTrimPlayback() {
    const video = videoRef.current;
    if (!video || trimming) return;
    if (video.paused) {
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) video.currentTime = trimStart;
      video.play().then(() => setTrimPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setTrimPlaying(false);
    }
  }

  async function applyTrim() {
    if (!file || trimming) return;

    const start = Math.max(0, Math.min(trimStart, videoDuration - MIN_TRIM_DURATION));
    const end = Math.max(start + MIN_TRIM_DURATION, Math.min(trimEnd, videoDuration));

    if (end - start < MIN_TRIM_DURATION || videoDuration < MIN_TRIM_DURATION) {
      alert('Trimmed reel must be at least 1 second long.');
      return;
    }

    if (start <= 0.05 && end >= videoDuration - 0.05) {
      setTrimStart(0);
      setTrimEnd(videoDuration);
      setDuration(Math.round(videoDuration));
      setTrimApplied(false);
      trimSnapshotRef.current = null;
        setTrimPlaying(false);
      setTrimOpen(false);
      return;
    }

    const sourceVideo = videoRef.current;
    const fallbackToServerTrim = () => {
      setTrimApplied(true);
      setCurrentTime(start);
      if (sourceVideo) {
        sourceVideo.currentTime = start;
        sourceVideo.play().catch(() => {});
      }
      setTrimOpen(false);
    };

    if (!sourceVideo || !('captureStream' in HTMLVideoElement.prototype) || typeof MediaRecorder === 'undefined') {
      fallbackToServerTrim();
      return;
    }

    // Client-side MediaRecorder trimming can hang on Android/WebView.
    // Use the already-supported server FFmpeg fallback there instead of blocking Done.
    const isAndroidWebView = /Android/i.test(navigator.userAgent) && /wv|; wv\)/i.test(navigator.userAgent);
    if (isAndroidWebView) {
      fallbackToServerTrim();
      return;
    }

    setTrimming(true);
    setTrimPlaying(false);
    sourceVideo.pause();
    let capturedStream: MediaStream | null | undefined = null;
    let trimTimeout: ReturnType<typeof setTimeout> | null = null;
    let trimCancelled = false;

    try {
      const fallbackTimer = new Promise<never>((_, reject) => {
        trimTimeout = setTimeout(() => {
          trimCancelled = true;
          sourceVideo.pause();
          reject(new Error('Client trim timed out'));
        }, 5000);
      });

      const runClientTrim = async () => {
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
      if (trimCancelled) throw new Error('Client trim cancelled');

      const captureStream = (sourceVideo as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream;
      if (typeof captureStream !== 'function') throw new Error('Trim is not supported on this browser.');
      const stream = captureStream.call(sourceVideo);
      capturedStream = stream;
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
      if (trimCancelled) throw new Error('Client trim cancelled');

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

      if (trimCancelled) {
        if (recorder.state === 'recording') recorder.stop();
        throw new Error('Client trim cancelled');
      }
      if (recorder.state === 'recording') recorder.stop();
      const blob = await finished;
      if (trimCancelled) throw new Error('Client trim cancelled');
      stream.getTracks().forEach((track) => track.stop());
      capturedStream = null;

      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const trimmedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, '') + '-trimmed.' + extension,
        { type: mimeType }
      );

      const nextUrl = URL.createObjectURL(trimmedFile);
      const oldPreviewUrl = previewUrl;
      setFile(trimmedFile);
      setPreviewUrl(nextUrl);
      if (oldPreviewUrl) URL.revokeObjectURL(oldPreviewUrl);
      setVideoDuration(end - start);
      setTrimStart(0);
      setTrimEnd(end - start);
      setDuration(Math.round(end - start));
      setCurrentTime(0);
      setTrimApplied(false);
      setTrimOpen(false);
      thumbnailCacheRef.current = null;
      setTimelineThumbnails([]);
      trimSnapshotRef.current = null;
      setTrimPlaying(false);
      };
      await Promise.race([runClientTrim(), fallbackTimer]);
    } catch {
      // If client-side recording is unavailable or fails, keep the selected range
      // and let the backend FFmpeg trim it during Post instead of blocking Done.
      fallbackToServerTrim();
    } finally {
      if (trimTimeout) clearTimeout(trimTimeout);
      const streamToStop = capturedStream as MediaStream | null;
      if (streamToStop) streamToStop.getTracks().forEach((track) => track.stop());
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
          disabled={posting || trimming || trimOpen || trimEnd <= trimStart}
          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
        >
          {posting ? (postTrimProcessing && uploadProgress === 100 ? 'Processing…' : `${uploadProgress ?? 0}%`) : 'Post'}
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-4">
        <video
          ref={videoRef}
          key={previewUrl}
          src={previewUrl}
          controls={!trimOpen}
          playsInline
          preload="auto"
          className="max-h-full max-w-full rounded-lg bg-black object-contain"
          style={activeFilterCss ? { filter: activeFilterCss } : undefined}
          onPlay={() => setTrimPlaying(true)}
          onPause={() => setTrimPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onError={() => setPreviewError(true)}
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
        {previewError && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Video preview is not supported on this device/browser. HEVC/HDR videos may not play here; MP4 (H.264) is recommended.
          </div>
        )}
        {posting && postTrimProcessing && uploadProgress === 100 && (
          <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/80">
            Processing… Please wait while the server prepares your reel.
          </div>
        )}
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
          <button onClick={openTrim} disabled={trimming} className="relative flex flex-col items-center gap-1 text-xs text-white disabled:opacity-50">
            <TrimIcon />
            Trim
            {(trimStart > 0.05 || (videoDuration > 0 && trimEnd < videoDuration - 0.05)) && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />}
          </button>
          <button onClick={() => { setCoverIndex(0); setCoverOpen(true); }} className="relative flex flex-col items-center gap-1 text-xs text-white">
            <CoverIcon />
            Cover
            {coverBlob && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />}
          </button>
          <button onClick={() => setFilterOpen(true)} className="relative flex flex-col items-center gap-1 text-xs text-white">
            <EffectsIcon />
            Effects
            {filter !== 'normal' && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />}
          </button>
          <button disabled className="flex flex-col items-center gap-1 text-xs text-white/40">
            <MusicIcon />
            Music
          </button>
          <span className="ml-auto text-[11px] text-white/50">{selectedDuration}s selected</span>
        </div>
      </div>

      {trimming && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-900 px-6 py-5 shadow-2xl">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm font-medium text-white">Trimming video…</p>
            <p className="text-xs text-white/50">Please wait</p>
          </div>
        </div>
      )}

      {trimOpen && (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-white/10 bg-neutral-950 p-4 pb-6 shadow-2xl">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Trim video</p>
              <p className="mt-0.5 text-xs text-white/50">{formatTrimTime(trimStart)} – {formatTrimTime(trimEnd)}</p>
            </div>
            <button onClick={cancelTrim} disabled={trimming} className="text-xs text-white/60 disabled:opacity-40">Cancel</button>
          </div>

          <div className="mb-3 flex items-center justify-center">
            <button
              type="button"
              onClick={toggleTrimPlayback}
              disabled={trimming}
              aria-label={trimPlaying ? 'Pause trim preview' : 'Play trim preview'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black disabled:opacity-40"
            >
              {trimPlaying ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-current"><path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7L9.53 4.65A1 1 0 0 0 8 5.5Z" /></svg>
              )}
            </button>
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
              className="pointer-events-none absolute top-5 h-10 rounded-lg border-2 border-emerald-400 bg-emerald-400/10"
              style={{ left: `${startPercent}%`, width: `${Math.max(0, endPercent - startPercent)}%` }}
            />

            {draggingHandle && (
              <div
                className="pointer-events-none absolute -top-8 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] font-semibold text-white shadow-lg"
                style={{ left: `${draggingHandle === 'start' ? startPercent : endPercent}%` }}
              >
                {formatTrimTime(draggingHandle === 'start' ? trimStart : trimEnd)}
              </div>
            )}

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
                if (!trimming) {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  try { navigator.vibrate?.(10); } catch {}
                  setDraggingHandle('start');
                }
              }}
              className="absolute top-2 z-10 flex h-16 w-6 items-center justify-center rounded-md bg-emerald-400 shadow-lg shadow-emerald-400/20"
              style={{ right: `${100 - startPercent}%` }}
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
                if (!trimming) {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  try { navigator.vibrate?.(10); } catch {}
                  setDraggingHandle('end');
                }
              }}
              className="absolute top-2 z-10 flex h-16 w-6 items-center justify-center rounded-md bg-emerald-400 shadow-lg shadow-emerald-400/20"
              style={{ left: `${endPercent}%` }}
            >
              <span className="h-8 w-1 rounded-full bg-white" />
            </button>

          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={resetTrim} disabled={trimming} className="flex-1 rounded-lg border border-white/15 py-2 text-sm text-white disabled:opacity-40">
              Reset
            </button>
            <button
              onClick={applyTrim}
              disabled={trimming}
              className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
            >
              {trimming ? 'Processing…' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {filterOpen && (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-white/10 bg-neutral-950 p-4 pb-6 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Effects</p>
            <button onClick={() => setFilterOpen(false)} className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black">Done</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {REEL_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="flex w-20 shrink-0 flex-col items-center gap-1.5"
              >
                <span className={`relative block h-28 w-20 overflow-hidden rounded-xl border-2 transition ${filter === f.id ? 'border-emerald-400' : 'border-white/10'}`}>
                  {filterThumb ? (
                    <img src={filterThumb} alt={f.name} className="h-full w-full object-cover" style={f.css ? { filter: f.css } : undefined} />
                  ) : (
                    <span className="block h-full w-full" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444,#8b5cf6,#3b82f6)', filter: f.css || undefined }} />
                  )}
                  {filter === f.id && (
                    <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[11px] font-bold text-black">✓</span>
                  )}
                </span>
                <span className={`text-[11px] font-medium ${filter === f.id ? 'text-emerald-400' : 'text-white/70'}`}>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {coverOpen && (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-white/10 bg-neutral-950 p-4 pb-6 shadow-2xl">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Select cover</p>
              <p className="mt-0.5 text-xs text-white/50">Pick a frame for your reel thumbnail</p>
            </div>
            <button onClick={() => setCoverOpen(false)} disabled={capturingCover} className="text-xs text-white/60 disabled:opacity-40">Cancel</button>
          </div>

          <div className="mb-4 flex justify-center">
            <div className="relative aspect-[9/16] w-32 overflow-hidden rounded-xl bg-black ring-1 ring-white/15">
              {timelineThumbnails[coverIndex] ? (
                <img src={timelineThumbnails[coverIndex]} alt="Cover preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-white/40">Loading…</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {timelineThumbnails.map((thumb, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCoverIndex(i)}
                className={`relative aspect-[3/4] overflow-hidden rounded-lg ring-2 transition ${i === coverIndex ? 'ring-white' : 'ring-transparent opacity-70'}`}
              >
                <img src={thumb} alt={`Frame ${i + 1}`} className="h-full w-full object-cover" />
                {i === coverIndex && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            {coverBlob && (
              <button onClick={() => { if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl); setCoverBlob(null); setCoverPreviewUrl(null); }} disabled={capturingCover} className="flex-1 rounded-lg border border-white/15 py-2 text-sm text-white disabled:opacity-40">
                Remove
              </button>
            )}
            <button
              onClick={() => captureCover(coverIndex)}
              disabled={capturingCover || !timelineThumbnails.length}
              className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-400 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
            >
              {capturingCover ? 'Processing…' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
