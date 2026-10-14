'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setPendingReelVideo } from '@/lib/pendingReelVideo';
import Toast from '@/components/Toast';

function CloseIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function FlipIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 014-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 01-4 4H3" /></svg>;
}
function GalleryIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>;
}
function FlashIcon({ on }: { on: boolean }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill={on ? 'white' : 'none'} stroke="white" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />{!on && <line x1="2" y1="2" x2="22" y2="22" />}</svg>;
}

const DURATIONS = [
  { label: '15s', seconds: 15 },
  { label: '60s', seconds: 60 },
  { label: '3m', seconds: 180 },
];

// TikTok-style camera effects (color filters applied live to preview)
const CAMERA_EFFECTS = [
  { id: 'normal', name: 'Normal', creator: 'Frianzo', css: '', cat: 'trending', swatch: '#888888' },
  { id: 'vivid', name: 'Vivid', creator: 'Frianzo', css: 'saturate(1.5) contrast(1.12)', cat: 'trending', swatch: '#ff6b6b' },
  { id: 'warm', name: 'Warm Glow', creator: 'Frianzo', css: 'sepia(0.3) saturate(1.4)', cat: 'trending', swatch: '#ffa502' },
  { id: 'cool', name: 'Cool Tone', creator: 'Frianzo', css: 'saturate(1.1) hue-rotate(-15deg)', cat: 'trending', swatch: '#70a1ff' },
  { id: 'beauty', name: 'Beauty', creator: 'Frianzo', css: 'brightness(1.08) saturate(1.2) contrast(1.02)', cat: 'trending', swatch: '#ffb8b8' },
  { id: 'bw', name: 'Mono', creator: 'Frianzo', css: 'grayscale(1) contrast(1.15)', cat: 'trending', swatch: '#57606f' },
  { id: 'vintage', name: 'Vintage', creator: 'Frianzo', css: 'sepia(0.5) saturate(0.8) contrast(0.95)', cat: 'trending', swatch: '#a0785a' },
  { id: 'sunset', name: 'Sunset', creator: 'Frianzo', css: 'sepia(0.4) saturate(1.6) hue-rotate(-20deg)', cat: 'trending', swatch: '#ff7f50' },
  { id: 'neon', name: 'Neon Pop', creator: 'Frianzo', css: 'saturate(2) contrast(1.3)', cat: 'games', swatch: '#eccc68' },
  { id: 'dreamy', name: 'Dreamy', creator: 'Frianzo', css: 'brightness(1.15) saturate(0.9) contrast(0.9)', cat: 'games', swatch: '#dfe4ea' },
  { id: 'noir', name: 'Noir', creator: 'Frianzo', css: 'grayscale(1) contrast(1.4) brightness(0.9)', cat: 'games', swatch: '#2f3542' },
  { id: 'golden', name: 'Golden', creator: 'Frianzo', css: 'sepia(0.6) saturate(1.3) brightness(1.05)', cat: 'games', swatch: '#e1b12c' },
];

const EFFECT_CATS = [
  { id: 'trending', name: 'Trending' },
  { id: 'games', name: 'Games' },
];

function EffectsIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" /></svg>;
}
function SaveIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>;
}

export default function ReelCameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [maxDuration, setMaxDuration] = useState(60);
  const [flashOn, setFlashOn] = useState(false);
  const [effectId, setEffectId] = useState('normal');
  const [effectsOpen, setEffectsOpen] = useState(false);
  const [effectCat, setEffectCat] = useState('trending');

  const activeEffect = CAMERA_EFFECTS.find((e) => e.id === effectId) || CAMERA_EFFECTS[0];
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async (mode: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setError('');
    } catch {
      setError('Camera access denied. Please allow camera permission.');
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
  };

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: !flashOn } as any] });
        setFlashOn(!flashOn);
      } else {
        setToast({ message: 'Flash not supported on this device.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Could not toggle flash.', type: 'error' });
    }
  };

  const startRecording = () => {
    if (!streamRef.current || recording) return;
    try {
      const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
      const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
        const file = new File([blob], `reel-${Date.now()}.webm`, { type: blob.type });
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.onloadedmetadata = () => {
          setPendingReelVideo(file, tempVideo.duration || 0);
          URL.revokeObjectURL(tempVideo.src);
          router.push('/reels/new');
        };
        tempVideo.src = URL.createObjectURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => {
        setRecordTime((t) => {
          const next = t + 1;
          if (next >= maxDuration) {
            // Auto-stop at max duration
            setTimeout(() => stopRecording(), 0);
          }
          return next;
        });
      }, 1000);
    } catch {
      setToast({ message: 'Recording failed to start.', type: 'error' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleGalleryPick = (file: File) => {
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('video/')) {
      tempVideo.onloadedmetadata = () => {
        setPendingReelVideo(file, tempVideo.duration || 0);
        URL.revokeObjectURL(url);
        router.push('/reels/new');
      };
      tempVideo.src = url;
    } else {
      // Image picked — go to reels/new with the image
      setPendingReelVideo(file, 0);
      URL.revokeObjectURL(url);
      router.push('/reels/new');
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full object-cover"
        style={activeEffect.css ? { filter: activeEffect.css } : undefined}
      />

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
        <button onClick={() => router.back()} aria-label="Close" className="p-2">
          <CloseIcon />
        </button>
        <button onClick={toggleFlash} aria-label="Flash" className="p-2">
          <FlashIcon on={flashOn} />
        </button>
      </div>

      {/* Recording timer + progress */}
      {recording && (
        <div className="absolute left-0 right-0 top-16 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-1.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-sm font-semibold text-white">{formatTime(recordTime)} / {formatTime(maxDuration)}</span>
          </div>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{ width: `${Math.min(100, (recordTime / maxDuration) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="absolute left-4 right-4 top-20 rounded-xl bg-red-500/90 p-3 text-center text-sm text-white">
          {error}
        </div>
      )}

      {/* Selected effect name — TikTok style top display */}
      {effectId !== 'normal' && !recording && (
        <div className="absolute left-0 right-0 top-16 flex flex-col items-center">
          <p className="text-lg font-semibold text-white drop-shadow">{activeEffect.name}</p>
          <p className="text-xs text-white/70">Created by: {activeEffect.creator}</p>
        </div>
      )}

      {/* Duration selector — TikTok style, clean pill row above effects */}
      {!recording && !effectsOpen && (
        <div className="absolute bottom-[236px] left-0 right-0 flex justify-center">
          <div className="flex items-center gap-1 rounded-full bg-black/40 p-1 backdrop-blur">
            {DURATIONS.map((d) => (
              <button
                key={d.seconds}
                onClick={() => setMaxDuration(d.seconds)}
                className={`rounded-full px-4 py-1 text-[13px] font-semibold transition ${
                  maxDuration === d.seconds
                    ? 'bg-white text-black'
                    : 'text-white/70'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Effects row — TikTok style horizontal circular thumbnails */}
      {!recording && !effectsOpen && (
        <div className="absolute bottom-[152px] left-0 right-0">
          <div className="flex items-center gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
            {CAMERA_EFFECTS.map((ef) => (
              <button
                key={ef.id}
                onClick={() => setEffectId(ef.id)}
                aria-label={ef.name}
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <span
                  className={`h-14 w-14 overflow-hidden rounded-full transition ${
                    effectId === ef.id ? 'ring-[3px] ring-white' : 'ring-1 ring-white/30'
                  }`}
                >
                  <img
                    src="/images/effect-preview-face.webp"
                    alt={ef.name}
                    className="h-full w-full object-cover"
                    style={ef.css ? { filter: ef.css } : undefined}
                  />
                </span>
                <span className={`max-w-16 truncate text-[10px] ${effectId === ef.id ? 'font-semibold text-white' : 'text-white/60'}`}>
                  {ef.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom controls — clean centered layout */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-4">
        <div className="flex items-center justify-center gap-10">
          {/* Gallery picker */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            aria-label="Pick from gallery"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
          >
            <GalleryIcon />
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleGalleryPick(file);
            }}
          />

          {/* Record button */}
          <button
            onClick={recording ? stopRecording : startRecording}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
            className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-[5px] border-white/90"
          >
            <span className={`bg-red-500 transition-all duration-200 ${recording ? 'h-7 w-7 rounded-lg' : 'h-[60px] w-[60px] rounded-full'}`} />
          </button>

          {/* Flip camera — moved here for symmetry */}
          <button
            onClick={toggleCamera}
            aria-label="Flip camera"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
          >
            <FlipIcon />
          </button>
        </div>

        {/* All effects button — TikTok style */}
        {!recording && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setEffectsOpen(true)}
              className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white backdrop-blur"
            >
              <EffectsIcon />
              All effects
            </button>
          </div>
        )}
      </div>

      {/* All Effects bottom sheet — TikTok style */}
      {effectsOpen && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEffectsOpen(false)} />
          <div className="relative max-h-[70%] rounded-t-3xl bg-[#1c1c1e] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-white">{activeEffect.name}</p>
                <p className="text-xs text-white/60">Created by: {activeEffect.creator}</p>
              </div>
              <button
                onClick={() => setEffectsOpen(false)}
                aria-label="Close effects"
                className="rounded-full bg-white/10 p-2"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mb-3 flex gap-6 border-b border-white/10">
              {EFFECT_CATS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setEffectCat(c.id)}
                  className={`pb-2 text-sm font-semibold transition ${
                    effectCat === c.id ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {c.name}
                  {effectCat === c.id && <div className="mx-auto mt-1 h-0.5 w-8 rounded-full bg-white" />}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3 overflow-y-auto pb-4" style={{ maxHeight: '40vh' }}>
              {CAMERA_EFFECTS.filter((e) => e.cat === effectCat).map((ef) => (
                <button
                  key={ef.id}
                  onClick={() => { setEffectId(ef.id); setEffectsOpen(false); }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`h-16 w-16 overflow-hidden rounded-2xl transition ${
                      effectId === ef.id ? 'ring-[3px] ring-white' : ''
                    }`}
                  >
                    <img
                      src="/images/effect-preview-face.webp"
                      alt={ef.name}
                      className="h-full w-full object-cover"
                      style={ef.css ? { filter: ef.css } : undefined}
                    />
                  </span>
                  <span className={`max-w-20 truncate text-[11px] ${effectId === ef.id ? 'font-semibold text-white' : 'text-white/60'}`}>
                    {ef.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
