'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { toggleFollow } from '@/lib/api/userApi';
import ShareModal from '@/components/ShareModal';
import {
  fetchReelsConfig,
  fetchReelFeed,
  fetchMyReelStatus,
  toggleReelLike,
  toggleReelFavorite,
  deleteReel,
  createReelWithProgress,
  fetchReelComments,
  addReelComment,
  deleteReelComment,
} from '@/lib/api/reelApi';

interface Reel {
  id: string;
  videoUrl: string;
  caption: string | null;
  durationSec: number | null;
  createdAt: string;
  likeCount: number;
  liked: boolean;
  favorited: boolean;
  isMine: boolean;
  friendStatus?: string;
  commentCount?: number;
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
function ShareIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
      <line x1="8.3" y1="10.7" x2="15.7" y2="6.3" /><line x1="8.3" y1="13.3" x2="15.7" y2="17.7" />
    </svg>
  );
}
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? 'white' : 'none'} stroke="white" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
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
function CommentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
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

function ReelItem({ reel, active, forcePause, onLikeChange, onFavoriteChange, onDeleted, onFollowed }: { reel: Reel; active: boolean; forcePause: boolean; onLikeChange: (id: string, liked: boolean, count: number) => void; onFavoriteChange: (id: string, favorited: boolean) => void; onDeleted: (id: string) => void; onFollowed: (userId: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [liking, setLiking] = useState(false);
  const [following, setFollowing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const { user: currentUser } = useAuth();

  async function openComments() {
    setCommentsOpen(true);
    setLoadingComments(true);
    const result = await fetchReelComments(reel.id);
    if (result.success) setComments(result.data.comments);
    setLoadingComments(false);
  }
  async function handleAddComment() {
    const content = commentText.trim();
    if (!content) return;
    setCommentText('');
    const result = await addReelComment(reel.id, content);
    if (result.success) setComments((prev) => [...prev, result.data.comment]);
  }
  async function handleDeleteComment(commentId: string) {
    const result = await deleteReelComment(commentId);
    if (result.success) setComments((prev) => prev.filter((c) => c.id !== commentId));
  }
  const showFollow = !reel.isMine && (reel.friendStatus === 'none' || reel.friendStatus === 'follow_back');

  async function handleFollow(e: React.MouseEvent) {
    e.stopPropagation();
    if (following) return;
    setFollowing(true);
    const result = await toggleFollow(reel.author.id);
    setFollowing(false);
    if (result.success && result.data.following) onFollowed(reel.author.id);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active) return;
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
  }, [active]);

  // Pauses (without resetting position/mute) while the "new reel" composer
  // is open over it, and resumes from the same spot once it closes.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!active || forcePause) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [active, forcePause]);

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

  async function handleFavorite() {
    if (favoriting) return;
    setFavoriting(true);
    onFavoriteChange(reel.id, !reel.favorited);
    const result = await toggleReelFavorite(reel.id);
    setFavoriting(false);
    if (result.success) onFavoriteChange(reel.id, result.data.favorited);
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
        className="h-full w-full select-none object-contain"
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
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
          <span className="relative h-9 w-9 flex-shrink-0">
            <span
              className="block h-9 w-9 overflow-hidden rounded-full border border-white/60 bg-slate-600 bg-cover bg-center"
              style={reel.author.profilePictureUrl ? { backgroundImage: `url(${reel.author.profilePictureUrl})` } : {}}
            />
            {showFollow && (
              <button
                onClick={handleFollow}
                disabled={following}
                aria-label="Follow"
                className="absolute -bottom-1 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-red-500 text-white disabled:opacity-50"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </span>
          <span className="text-sm font-semibold">{reel.author.displayName}</span>
        </Link>
        {reel.caption && <p className="text-sm">{reel.caption}</p>}
      </div>

      <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-5">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <HeartIcon filled={reel.liked} />
          <span className="text-xs font-medium text-white">{reel.likeCount}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); openComments(); }} className="flex flex-col items-center gap-1">
          <CommentIcon />
          <span className="text-xs font-medium text-white">{reel.commentCount ?? ''}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleFavorite(); }} className="flex flex-col items-center gap-1">
          <BookmarkIcon filled={reel.favorited} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShareOpen(true); }} className="flex flex-col items-center gap-1">
          <ShareIcon />
        </button>
        {reel.isMine && (
          <button onClick={handleDelete} className="flex flex-col items-center gap-1">
            <TrashIcon />
          </button>
        )}
      </div>

      {shareOpen && <ShareModal reelId={reel.id} onClose={() => setShareOpen(false)} />}

      {commentsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={(e) => { e.stopPropagation(); setCommentsOpen(false); }}
        >
          <div className="flex h-[70vh] w-full max-w-xl flex-col rounded-t-2xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="border-b py-3 text-center text-sm font-semibold text-slate-800">Comments</div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loadingComments ? (
                <p className="pt-6 text-center text-sm text-slate-400">Loading...</p>
              ) : comments.length === 0 ? (
                <p className="pt-6 text-center text-sm text-slate-400">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="mb-3 flex items-start gap-2">
                    <span
                      className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 bg-cover bg-center"
                      style={c.user.profilePictureUrl ? { backgroundImage: `url(${c.user.profilePictureUrl})` } : {}}
                    />
                    <div className="flex-1 rounded-2xl bg-slate-100 px-3 py-2">
                      <p className="text-sm font-semibold">{c.user.displayName}</p>
                      <p className="text-sm">{c.content}</p>
                    </div>
                    {(c.user.id === currentUser?.id || reel.isMine) && (
                      <button onClick={() => handleDeleteComment(c.id)} className="mt-2 text-xs text-slate-400">✕</button>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 border-t p-3">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 rounded-full border px-4 py-2 text-sm"
              />
              <button onClick={handleAddComment} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">Send</button>
            </div>
          </div>
        </div>
      )}
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
  function handleFavoriteChange(id: string, favorited: boolean) {
    setReels((prev) => prev.map((r) => (r.id === id ? { ...r, favorited } : r)));
  }
  function handleDeleted(id: string) {
    setReels((prev) => prev.filter((r) => r.id !== id));
  }

  async function openUpload() {
    const status = await fetchMyReelStatus();
    const rem = status.success ? status.data.remaining : null;
    setRemaining(rem);
    if (rem === 0) {
      setUploadOpen(true);
    } else {
      fileInputRef.current?.click();
    }
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
      setPreviewUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return URL.createObjectURL(file);
      });
      setUploadOpen(true);
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
              <ReelItem reel={reel} active={i === activeIndex} forcePause={uploadOpen} onLikeChange={handleLikeChange} onFavoriteChange={handleFavoriteChange} onDeleted={handleDeleted}
                onFollowed={(userId) => setReels((prev) => prev.map((r) => (r.author.id === userId ? { ...r, friendStatus: r.friendStatus === 'follow_back' ? 'friends' : 'following' } : r)))} />
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
                className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-medium text-slate-800">Choose a video</span>
                  <span className="block text-xs text-slate-400">Max {config.maxDurationSec} seconds</span>
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                {previewUrl && <video src={previewUrl} controls className="max-h-64 w-full rounded-lg bg-black" />}
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption"
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
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      setPendingFile(null);
                      fileInputRef.current?.click();
                    }}
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
