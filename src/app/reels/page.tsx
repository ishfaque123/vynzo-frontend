'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import {
  fetchReelsConfig,
  fetchReelFeed,
  fetchMyReelStatus,
  toggleReelLike,
  deleteReel,
  createReelWithProgress,
} from '@/lib/api/reelApi';

interface Reel {
  id: string;
  videoUrl: string;
  caption: string | null;
  durationSec: number | null;
  createdAt: string;
  likeCount: number;
  liked: boolean;
  isMine: boolean;
  author: { id: string; username: string; displayName: string; profilePictureUrl?: string };
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill={filled ? '#f43f5e' : 'none'} stroke={filled ? '#f43f5e' : 'white'} strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  );
}
function MuteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
function UnmuteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 010 7" /><path d="M18.5 5.5a9 9 0 010 13" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ReelItem({ reel, active, onLikeChange, onDeleted }: { reel: Reel; active: boolean; onLikeChange: (id: string, liked: boolean, count: number) => void; onDeleted: (id: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      video.currentTime = 0;
      video.muted = false;
      setIsMuted(false);
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Browser blocked unmuted autoplay — fall back to muted so the
          // reel still plays, matching what the status-video player does.
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      }
    } else {
      video.pause();
    }
  }, [active]);

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  async function handleLike() {
    if (liking) return;
    setLiking(true);
    const nextLiked = !reel.liked;
    onLikeChange(reel.id, nextLiked, reel.likeCount + (nextLiked ? 1 : -1));
    const result = await toggleReelLike(reel.id);
    setLiking(false);
    if (result.success) onLikeChange(reel.id, result.data.liked, reel.likeCount + (result.data.liked ? 1 : -1));
  }

  async function handleDelete() {
    if (!confirm('Delete this reel?')) return;
    const result = await deleteReel(reel.id);
    if (result.success) onDeleted(reel.id);
  }

  return (
    <div className="relative flex h-full w-full flex-shrink-0 snap-start items-center justify-center bg-black" style={{ scrollSnapStop: 'always' }}>
      <video
        ref={videoRef}
        src={reel.videoUrl}
        loop
        muted={isMuted}
        playsInline
        className="h-full w-full object-contain"
        onClick={() => {
          const video = videoRef.current;
          if (!video) return;
          if (video.paused) video.play().catch(() => {});
          else video.pause();
        }}
      />

      <button onClick={toggleMute} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40">
        {isMuted ? <MuteIcon /> : <UnmuteIcon />}
      </button>

      <div className="absolute bottom-0 left-0 right-16 z-10 p-4 pb-6 text-white">
        <Link href={`/u/${reel.author.username}`} className="mb-2 flex items-center gap-2">
          <span
            className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-white/60 bg-slate-600 bg-cover bg-center"
            style={reel.author.profilePictureUrl ? { backgroundImage: `url(${reel.author.profilePictureUrl})` } : {}}
          />
          <span className="text-sm font-semibold">{reel.author.displayName}</span>
        </Link>
        {reel.caption && <p className="text-sm">{reel.caption}</p>}
      </div>

      <div className="absolute bottom-6 right-3 z-10 flex flex-col items-center gap-5">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <HeartIcon filled={reel.liked} />
          <span className="text-xs font-medium text-white">{reel.likeCount}</span>
        </button>
        {reel.isMine && (
          <button onClick={handleDelete} className="flex flex-col items-center gap-1">
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<{ enabled: boolean; maxDurationSec: number; dailyLimit: number } | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingDuration, setPendingDuration] = useState<number>(0);
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReelsConfig().then((res) => {
      if (res.success) setConfig(res.data);
    });
  }, []);

  function loadFeed() {
    setLoading(true);
    fetchReelFeed(0).then((res) => {
      if (res.success) {
        setReels(res.data.reels);
        setHasMore(!!res.data.hasMore);
        setOffset(res.data.reels.length);
      }
      setLoading(false);
    });
  }
  useEffect(() => {
    if (config?.enabled) loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.enabled]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const res = await fetchReelFeed(offset);
    setLoadingMore(false);
    if (res.success) {
      setReels((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        return [...prev, ...res.data.reels.filter((r: Reel) => !ids.has(r.id))];
      });
      setHasMore(!!res.data.hasMore);
      setOffset((o) => o + res.data.reels.length);
    }
  }

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: '600px' });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, hasMore, loadingMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = itemRefs.current.findIndex((el) => el === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [reels.length]);

  function handleLikeChange(id: string, liked: boolean, count: number) {
    setReels((prev) => prev.map((r) => (r.id === id ? { ...r, liked, likeCount: Math.max(0, count) } : r)));
  }
  function handleDeleted(id: string) {
    setReels((prev) => prev.filter((r) => r.id !== id));
  }

  async function openUpload() {
    const status = await fetchMyReelStatus();
    if (status.success) setRemaining(status.data.remaining);
    setUploadOpen(true);
  }

  function handleFilePicked(file: File) {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(probe.src);
      const maxDuration = config?.maxDurationSec ?? 60;
      if (probe.duration > maxDuration) {
        alert(`Reels must be ${maxDuration} seconds or shorter.`);
        return;
      }
      setPendingFile(file);
      setPendingDuration(probe.duration);
    };
    probe.src = URL.createObjectURL(file);
  }

  async function handlePost() {
    if (!pendingFile || posting) return;
    setPosting(true);
    setUploadProgress(0);
    const result = await createReelWithProgress({ video: pendingFile, caption: caption.trim() || undefined, durationSec: pendingDuration }, setUploadProgress);
    setPosting(false);
    setUploadProgress(null);
    if (result.success) {
      setUploadOpen(false);
      setPendingFile(null);
      setCaption('');
      loadFeed();
    } else {
      alert(result.error?.message || 'Could not post your reel. Please try again.');
    }
  }

  if (!config) {
    return <div className="flex min-h-[70vh] items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!config.enabled) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center text-slate-500">
        <p className="text-lg font-semibold text-slate-700">Reels are unavailable right now</p>
        <p className="mt-2 text-sm">Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 bg-black">
      {loading ? (
        <div className="flex h-full items-center justify-center text-white">Loading...</div>
      ) : reels.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-white">
          <p>No reels yet. Be the first to post one!</p>
        </div>
      ) : (
        <div ref={containerRef} className="h-full w-full snap-y snap-mandatory overflow-y-scroll">
          {reels.map((reel, i) => (
            <div key={reel.id} ref={(el) => { itemRefs.current[i] = el; }} className="h-full w-full snap-start">
              <ReelItem reel={reel} active={i === activeIndex} onLikeChange={handleLikeChange} onDeleted={handleDeleted} />
            </div>
          ))}
          <div ref={sentinelRef} className="h-1 w-full" />
        </div>
      )}

      <button
        onClick={() => router.back()}
        aria-label="Back"
        className="absolute left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur"
      >
        <BackIcon />
      </button>

      <button
        onClick={openUpload}
        aria-label="Post a reel"
        className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur"
      >
        <PlusIcon />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) handleFilePicked(file);
        }}
      />

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => { setUploadOpen(false); setPendingFile(null); }}>
          <div className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">New reel</p>
              <button onClick={() => { setUploadOpen(false); setPendingFile(null); }} className="text-slate-500">
                <CloseIcon />
              </button>
            </div>

            {remaining === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                You've already posted your reel for today. Come back tomorrow!
              </p>
            ) : !pendingFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 text-sm font-medium text-slate-600"
              >
                Choose a video (max {config.maxDurationSec}s)
              </button>
            ) : (
              <div className="space-y-3">
                <video src={URL.createObjectURL(pendingFile)} controls className="max-h-64 w-full rounded-lg bg-black" />
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption (optional)"
                  rows={2}
                  maxLength={500}
                  className="w-full resize-none rounded-lg border px-3 py-2 text-sm"
                />
                {uploadProgress !== null && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingFile(null)}
                    className="flex-1 rounded-full border py-2.5 text-sm font-medium text-slate-700"
                  >
                    Choose different video
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={posting}
                    className="flex-1 rounded-full bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {posting ? `Posting ${uploadProgress ?? 0}%` : 'Post'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
