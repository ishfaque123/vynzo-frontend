'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { toggleFollow, fetchFollowStatus } from '@/lib/api/userApi';
import ShareModal from '@/components/ShareModal';
import ReelCommentsModal from '@/components/ReelCommentsModal';
import ReelReportModal from '@/components/ReelReportModal';
import { fetchReelsConfig, fetchReelFeed, fetchMyReelStatus, toggleReelLike, toggleReelFavorite, deleteReel, recordReelView, fetchReelById } from '@/lib/api/reelApi';
import { fetchReelComments } from '@/lib/api/reelCommentApi';
import { setPendingReelVideo } from '@/lib/pendingReelVideo';
import VerifiedBadge from '@/components/VerifiedBadge';

interface Reel { id: string; videoUrl: string; caption: string | null; durationSec: number | null; createdAt: string; likeCount: number; liked: boolean; favorited: boolean; isMine: boolean; friendStatus?: string; commentCount?: number; author: { id: string; username: string; displayName: string; profilePictureUrl?: string; isVerified?: boolean }; }
function HeartIcon({ filled, size = 30 }: { filled: boolean; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#f43f5e' : 'none'} stroke={filled ? '#f43f5e' : 'white'} strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>; }
function PlayIcon({ playing }: { playing: boolean }) { return playing ? <svg width="38" height="38" viewBox="0 0 24 24" fill="white"><rect x="5" y="4" width="5" height="16" rx="1" /><rect x="14" y="4" width="5" height="16" rx="1" /></svg> : <svg width="38" height="38" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>; }
function SeekIcon({ forward }: { forward: boolean }) { return <div className="relative flex h-14 w-14 items-center justify-center"><svg width="50" height="50" viewBox="0 0 42 42" fill="none" stroke="white" strokeWidth="2.2"><path d={forward ? 'M18 10a12 12 0 11-8.4 20.5' : 'M24 10a12 12 0 11-8.4 20.5'} /><path d={forward ? 'M25 6l-1 7 7-1' : 'M17 6l1 7-7-1'} /></svg><span className="absolute text-[10px] font-bold text-white">10</span></div>; }
function TrashIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>; }
function FlagIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M5 21V4" /><path d="M5 4c5-3 9 3 14 0v9c-5 3-9-3-14 0" /></svg>; }
function MuteIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>; }
function UnmuteIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 010 7" /><path d="M18.5 5.5a9 9 0 010 13" /></svg>; }
function ReelNotice({ message, confirm, onClose, onConfirm }: { message: string; confirm?: boolean; onClose: () => void; onConfirm?: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm" onClick={onClose}>
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-5 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-3 flex items-center gap-3">
        <img src="/logo.png" alt="Frianzo" className="h-9 w-9 object-contain" />
        <h3 className="text-base font-semibold">{confirm ? 'Confirm action' : 'Frianzo'}</h3>
      </div>
      <p className="text-sm leading-6 text-white/80">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        {confirm && <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10">Cancel</button>}
        <button type="button" onClick={confirm ? onConfirm : onClose} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">{confirm ? 'Delete' : 'OK'}</button>
      </div>
    </div>
  </div>;
}

function PlusIcon() { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function ShareIcon() { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><line x1="8.3" y1="10.7" x2="15.7" y2="6.3" /><line x1="8.3" y1="13.3" x2="15.7" y2="17.7" /></svg>; }
function BookmarkIcon({ filled }: { filled: boolean }) { return <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? 'white' : 'none'} stroke="white" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" /></svg>; }
function CommentIcon() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>; }

type HeartBurst = { id: number; left: number; top: number };

function ReelItem({ reel, active, forcePause, preload, onLikeChange, onFavoriteChange, onDeleted, onFollowed, onCommentCountChange }: { reel: Reel; active: boolean; forcePause: boolean; preload: boolean; onLikeChange: (id: string, liked: boolean, count: number) => void; onFavoriteChange: (id: string, favorited: boolean) => void; onDeleted: (id: string) => void; onFollowed: (userId: string) => void; onCommentCountChange: (id: string, delta: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef(0);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartTimersRef = useRef<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [following, setFollowing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  const [heartBursts, setHeartBursts] = useState<HeartBurst[]>([]);
  const [showControls, setShowControls] = useState(false);
  const [seekFeedback, setSeekFeedback] = useState<'back' | 'forward' | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [notice, setNotice] = useState<{ message: string; confirm: boolean } | null>(null);
  const { user: currentUser } = useAuth();
  const CAPTION_LIMIT = 80;
  const captionLong = (reel.caption?.length || 0) > CAPTION_LIMIT;
  const captionShown = !captionLong || captionExpanded ? reel.caption : `${reel.caption!.slice(0, CAPTION_LIMIT)}...`;

  function revealControls() { setShowControls(true); if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500); }
  useEffect(() => () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); heartTimersRef.current.forEach((timer) => window.clearTimeout(timer)); }, []);
  async function openComments() {
    setCommentsOpen(true);
    setCommentsLoading(true);
    setCommentsCursor(null);
    setCommentsHasMore(false);
    setComments([]);
    const result = await fetchReelComments(reel.id);
    setCommentsLoading(false);
    if (result.success) {
      setComments(result.data.comments || []);
      setCommentsCursor(result.data.pagination?.nextCursor || null);
      setCommentsHasMore(!!result.data.pagination?.hasMore);
    }
  }
  async function loadMoreComments() {
    if (commentsLoadingMore || !commentsHasMore) return;
    setCommentsLoadingMore(true);
    const result = await fetchReelComments(reel.id, commentsCursor);
    setCommentsLoadingMore(false);
    if (!result.success) return;
    setComments((prev) => [...prev, ...(result.data.comments || [])]);
    setCommentsCursor(result.data.pagination?.nextCursor || null);
    setCommentsHasMore(!!result.data.pagination?.hasMore);
  }
  useEffect(() => { function refresh(e: Event) { const detail = (e as CustomEvent).detail; if (detail === reel.id && commentsOpen) void openComments(); } window.addEventListener('reel-comments-refresh', refresh); return () => window.removeEventListener('reel-comments-refresh', refresh); }, [reel.id, commentsOpen]);
  useEffect(() => { if (!active) return; void recordReelView(reel.id).then((result) => { if (result.success) setViewCount(Number(result.data?.viewCount || 0)); }); }, [active, reel.id]);
  const showFollow = !reel.isMine && (reel.friendStatus === 'none' || reel.friendStatus === 'follow_back');
  async function handleFollow(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); if (following) return; setFollowing(true); const result = await toggleFollow(reel.author.id); setFollowing(false); if (result.success && result.data.following) onFollowed(reel.author.id); }
  useEffect(() => { const video = videoRef.current; if (!video) return; if (!active) { video.pause(); setIsPlaying(false); return; } video.currentTime = 0; video.muted = false; setIsMuted(false); setShowControls(false); setIsPlaying(false); setIsVideoLoading(video.readyState < 3); video.play().then(() => setIsPlaying(true)).catch(() => { video.muted = true; setIsMuted(true); video.play().then(() => setIsPlaying(true)).catch(() => {}); }); }, [active]);
  useEffect(() => { const video = videoRef.current; if (!video || !active) return; if (forcePause) { video.pause(); setIsPlaying(false); } else if (video.paused) { video.play().then(() => setIsPlaying(true)).catch(() => {}); } }, [forcePause]);
  function toggleMute(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); const video = videoRef.current; if (!video) return; video.muted = !video.muted; setIsMuted(video.muted); }
  function togglePlayback(e?: React.MouseEvent) { e?.preventDefault(); e?.stopPropagation(); const video = videoRef.current; if (!video) return; if (video.paused) { video.play().then(() => setIsPlaying(true)).catch(() => {}); } else { video.pause(); setIsPlaying(false); } revealControls(); }
  function seek(seconds: number, e?: React.MouseEvent) { e?.preventDefault(); e?.stopPropagation(); const video = videoRef.current; if (!video) return; const duration = Number.isFinite(video.duration) ? video.duration : 0; video.currentTime = Math.max(0, Math.min(duration || Infinity, video.currentTime + seconds)); setSeekFeedback(seconds > 0 ? 'forward' : 'back'); window.setTimeout(() => setSeekFeedback(null), 550); revealControls(); }
  function handleVideoTap(e: React.MouseEvent<HTMLVideoElement>) { const now = Date.now(); if (now - lastTapRef.current < 300) { lastTapRef.current = 0; e.preventDefault(); e.stopPropagation(); if (!reel.liked && !liking) void handleLike(); const burst: HeartBurst = { id: Date.now() + Math.random(), left: 42 + Math.random() * 16, top: 38 + Math.random() * 22 }; setHeartBursts((items) => [...items, burst]); const timer = window.setTimeout(() => setHeartBursts((items) => items.filter((item) => item.id !== burst.id)), 700); heartTimersRef.current.push(timer); return; } lastTapRef.current = now; window.setTimeout(() => { if (lastTapRef.current !== now) return; lastTapRef.current = 0; revealControls(); }, 300); }
  async function handleLike() { if (liking) return; setLiking(true); const nextLiked = !reel.liked; const optimisticCount = Math.max(0, reel.likeCount + (nextLiked ? 1 : -1)); onLikeChange(reel.id, nextLiked, optimisticCount); const result = await toggleReelLike(reel.id); setLiking(false); if (result.success) onLikeChange(reel.id, result.data.liked, result.data.likeCount); else onLikeChange(reel.id, reel.liked, reel.likeCount); }
  async function handleFavorite() { if (favoriting) return; setFavoriting(true); onFavoriteChange(reel.id, !reel.favorited); const result = await toggleReelFavorite(reel.id); setFavoriting(false); if (result.success) onFavoriteChange(reel.id, result.data.favorited); else onFavoriteChange(reel.id, reel.favorited); }
  async function handleDelete() { setNotice({ message: 'Delete this reel? This action cannot be undone.', confirm: true }); }
  async function confirmDelete() { setNotice(null); const result = await deleteReel(reel.id); if (result.success) onDeleted(reel.id); else setNotice({ message: result.error?.message || 'Unable to delete this reel. Please try again.', confirm: false }); }

  return <div className="relative flex h-full w-full flex-shrink-0 items-center justify-center bg-black">
    <video ref={videoRef} src={reel.videoUrl} playsInline muted={isMuted} preload={preload ? 'auto' : 'metadata'} className="h-full w-full select-none object-contain" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }} onContextMenu={(e) => e.preventDefault()} onClick={handleVideoTap} onLoadStart={() => setIsVideoLoading(true)} onWaiting={() => setIsVideoLoading(true)} onCanPlay={() => setIsVideoLoading(false)} onPlaying={() => { setIsPlaying(true); setIsVideoLoading(false); }} onPause={() => setIsPlaying(false)} onEnded={(e) => { const video = e.currentTarget; video.currentTime = 0; void video.play().then(() => setIsPlaying(true)).catch(() => {}); }} />
    {active && isVideoLoading && <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" aria-label="Loading video" /></div>}
    {heartBursts.map((heart) => <div key={heart.id} className="pointer-events-none absolute z-30" style={{ left: `${heart.left}%`, top: `${heart.top}%`, transform: 'translate(-50%, -50%)' }}><div className="animate-[heartPop_700ms_ease-out_forwards] drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"><HeartIcon filled size={105} /></div></div>)}
    {seekFeedback && <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"><div className="rounded-2xl bg-black/70 px-6 py-4 text-base font-bold text-white">{seekFeedback === 'forward' ? '+10 sec' : '-10 sec'}</div></div>}
    <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} className="absolute right-4 top-20 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/60">{isMuted ? <MuteIcon /> : <UnmuteIcon />}</button>
    {showControls && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"><div className="pointer-events-auto flex items-center gap-8 px-4 py-3"><button aria-label="Back 10 seconds" onClick={(e) => seek(-10, e)} className="flex h-14 w-14 items-center justify-center"><SeekIcon forward={false} /></button><button aria-label="Play or pause" onClick={togglePlayback} className="flex h-14 w-14 items-center justify-center"><PlayIcon playing={isPlaying} /></button><button aria-label="Forward 10 seconds" onClick={(e) => seek(10, e)} className="flex h-14 w-14 items-center justify-center"><SeekIcon forward /></button></div></div>}
    <div className="absolute bottom-2 left-0 right-16 z-10 p-4 pb-4 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]"><div className="relative mb-2 flex items-center gap-2"><Link href={`/u/${reel.author.username}`} className="flex min-w-0 items-center gap-2"><span className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-white/60 bg-slate-600 bg-cover bg-center" style={reel.author.profilePictureUrl ? { backgroundImage: `url(${reel.author.profilePictureUrl})` } : {}} /><span className="text-sm font-semibold">{reel.author.displayName}</span>{reel.author.isVerified && <VerifiedBadge size="sm" />}</Link>{showFollow && <button type="button" onClick={handleFollow} disabled={following} aria-label="Follow" className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-white disabled:opacity-50">Follow</button>}</div>{reel.caption && <p className="text-sm">{captionShown}{captionLong && <button onClick={(e) => { e.stopPropagation(); setCaptionExpanded((v) => !v); }} className="ml-1 font-semibold text-white/80">{captionExpanded ? 'less' : 'more'}</button>}</p>}</div>
    <div className="absolute bottom-6 right-3 z-20 flex flex-col items-center gap-4 pb-1 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] [&_svg]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"><button onClick={(e) => { e.stopPropagation(); void handleLike(); }} className="flex flex-col items-center gap-1"><HeartIcon filled={reel.liked} /><span className="text-xs font-medium text-white">{reel.likeCount}</span></button><button onClick={(e) => { e.stopPropagation(); void openComments(); }} className="flex flex-col items-center gap-1"><CommentIcon /><span className="text-xs font-medium text-white">{reel.commentCount || 0}</span></button><button onClick={(e) => { e.stopPropagation(); setShareOpen(true); }} className="flex flex-col items-center gap-1"><ShareIcon /><span className="text-xs font-medium text-white">Share</span></button><button onClick={(e) => { e.stopPropagation(); void handleFavorite(); }} className="flex flex-col items-center gap-1"><BookmarkIcon filled={reel.favorited} /><span className="text-xs font-medium text-white">Save</span></button><div className="flex flex-col items-center gap-1 text-white"><span className="text-xs font-medium">{viewCount}</span><span className="text-[10px]">Views</span></div>{reel.isMine ? <button onClick={(e) => { e.stopPropagation(); void handleDelete(); }} className="flex flex-col items-center gap-1"><TrashIcon /><span className="text-xs font-medium text-white">Delete</span></button> : <button onClick={(e) => { e.stopPropagation(); setReportOpen(true); }} className="flex flex-col items-center gap-1"><FlagIcon /><span className="text-xs font-medium text-white">Report</span></button>}</div>
    {shareOpen && <ShareModal onClose={() => setShareOpen(false)} reelId={reel.id} />}
    {commentsOpen && <ReelCommentsModal onClose={() => setCommentsOpen(false)} reelId={reel.id} comments={comments} currentUserId={currentUser?.id || ''} reelOwner={reel.isMine} loading={commentsLoading} hasMore={commentsHasMore} loadingMore={commentsLoadingMore} onLoadMore={loadMoreComments} onCountChange={(delta) => onCommentCountChange(reel.id, delta)} />}
    {reportOpen && <ReelReportModal reelId={reel.id} onClose={() => setReportOpen(false)} />}
    {notice && <ReelNotice message={notice.message} confirm={notice.confirm} onClose={() => setNotice(null)} onConfirm={confirmDelete} />}
  </div>;
}

export default function ReelsPage() {
  const router = useRouter();
  useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingMoreRef = useRef(false);
  const gestureLockedRef = useRef(false);
  const wheelLockRef = useRef(false);
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [uploadReady, setUploadReady] = useState(false);
  const [uploadMaxDuration, setUploadMaxDuration] = useState(60);
  const [reelsEnabled, setReelsEnabled] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [forcePause] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const targetId = new URLSearchParams(window.location.search).get('id');
      const [targetResult, feed, status, config] = await Promise.all([
        targetId ? fetchReelById(targetId) : Promise.resolve(null),
        fetchReelFeed(),
        fetchMyReelStatus(),
        fetchReelsConfig(),
      ]);
      if (cancelled) return;

      let combined: Reel[] = feed.success ? (feed.data.reels || []) : [];
      if (targetId && targetResult && targetResult.success) {
        const targetReel: Reel = targetResult.data.reel;
        combined = [targetReel, ...combined.filter((item) => item.id !== targetReel.id)];
      }

      const authorIds = [...new Set(combined.filter((item: Reel) => !item.isMine).map((item: Reel) => item.author.id))] as string[];
      const statusResults: Array<[string, string] | null> = await Promise.all(authorIds.map(async (userId) => {
        const result = await fetchFollowStatus(userId);
        const followStatus = result.success ? result.data?.status : null;
        return typeof followStatus === 'string' ? [userId, followStatus] : null;
      }));
      if (cancelled) return;
      const statusMap = new Map<string, string>();
      statusResults.forEach((item) => { if (item && typeof item[0] === 'string' && typeof item[1] === 'string') statusMap.set(item[0], item[1]); });
      setReels(combined.map((item: Reel) => statusMap.has(item.author.id) ? { ...item, friendStatus: statusMap.get(item.author.id) } : item));
      setHasMore(!!feed.data?.hasMore);

      const enabled = !!(config.success && config.data?.enabled);
      const remaining = status.success ? Number(status.data?.remaining) : 0;
      setReelsEnabled(enabled);
      setUploadMaxDuration(Number(config.data?.maxDurationSec) > 0 ? Number(config.data.maxDurationSec) : 60);
      setUploadReady(enabled && status.success && Number.isFinite(remaining) && remaining > 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { const root = document.getElementById('reels-feed'); if (!root) return; const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reel-index]')); if (!items.length) return; const observer = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (!visible) return; const visibleIndex = Number((visible.target as HTMLElement).dataset.reelIndex); setActiveIndex(visibleIndex); if (visibleIndex >= reels.length - 3 && hasMore && !loadingMoreRef.current) { loadingMoreRef.current = true; void fetchReelFeed(reels.length).then((result) => { if (result.success) { setReels((items) => [...items, ...(result.data.reels || [])]); setHasMore(!!result.data.hasMore); } }).finally(() => { loadingMoreRef.current = false; }); } }, { root, threshold: [0.6, 0.8, 1] }); items.forEach((item) => observer.observe(item)); return () => observer.disconnect(); }, [reels.length, hasMore]);
  function updateLike(id: string, liked: boolean, count: number) { setReels((items) => items.map((item) => item.id === id ? { ...item, liked, likeCount: count } : item)); }
  function updateFavorite(id: string, favorited: boolean) { setReels((items) => items.map((item) => item.id === id ? { ...item, favorited } : item)); }
  function updateCommentCount(id: string, delta: number) { setReels((items) => items.map((item) => item.id === id ? { ...item, commentCount: Math.max(0, (item.commentCount || 0) + delta) } : item)); }
  function handleFollowed(userId: string) { setReels((items) => items.map((item) => item.author.id === userId ? { ...item, friendStatus: 'following' } : item)); }
  function handleDeleted(id: string) { setReels((items) => items.filter((item) => item.id !== id)); }
  function scrollToIndex(index: number) {
    const root = document.getElementById('reels-feed');
    if (!root) return;
    const targetIndex = Math.max(0, Math.min(index, reels.length - 1));
    setActiveIndex(targetIndex);
    root.scrollTo({ top: targetIndex * root.clientHeight, behavior: 'smooth' });
  }
  function getCurrentIndex() {
    const root = document.getElementById('reels-feed');
    if (!root || !root.clientHeight) return activeIndex;
    return Math.max(0, Math.min(reels.length - 1, Math.round(root.scrollTop / root.clientHeight)));
  }
  function goNext() {
    if (gestureLockedRef.current || !reels.length) return;
    const currentIndex = getCurrentIndex();
    if (currentIndex >= reels.length - 1) return;
    gestureLockedRef.current = true;
    scrollToIndex(currentIndex + 1);
    window.setTimeout(() => { gestureLockedRef.current = false; }, 550);
  }
  function goPrevious() {
    if (gestureLockedRef.current || !reels.length) return;
    const currentIndex = getCurrentIndex();
    if (currentIndex <= 0) return;
    gestureLockedRef.current = true;
    scrollToIndex(currentIndex - 1);
    window.setTimeout(() => { gestureLockedRef.current = false; }, 550);
  }
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) { if (Math.abs(e.deltaY) < 8) return; e.preventDefault(); if (wheelLockRef.current) return; wheelLockRef.current = true; if (e.deltaY > 0) goNext(); else goPrevious(); window.setTimeout(() => { wheelLockRef.current = false; }, 650); }
  async function handleUpload() {
    if (!reelsEnabled) return;
    const status = await fetchMyReelStatus();
    if (!status.success) { setNotice(status.error?.message || 'Unable to check reel upload limit. Please try again.'); return; }
    const remaining = Number(status.data?.remaining);
    if (!Number.isFinite(remaining) || remaining <= 0) { setUploadReady(false); setNotice("You've reached your reel limit for the last 24 hours. Please try again later."); return; }
    fileInputRef.current?.click();
  }
  function handleFilePicked(file: File) {
    if (!file.type.startsWith('video/')) { setNotice('Please select a video file.'); return; }
    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => { const duration = probe.duration; URL.revokeObjectURL(objectUrl); probe.removeAttribute('src'); probe.load(); if (!Number.isFinite(duration) || duration <= 0) { setNotice('Could not read the video duration. Please choose another video.'); return; } if (duration > uploadMaxDuration) { setNotice(`Reels must be ${uploadMaxDuration} seconds or shorter.`); return; } setPendingReelVideo(file, duration); router.push('/reels/new'); };
    probe.onerror = () => { URL.revokeObjectURL(objectUrl); probe.removeAttribute('src'); probe.load(); setNotice('Could not read this video. Please choose another video.'); };
    probe.src = objectUrl;
  }
  if (loading) return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="relative flex h-20 w-20 items-center justify-center" role="status" aria-label="Loading Frianzo reels">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <img src="/logo.png" alt="Frianzo" className="h-12 w-12 object-contain" />
      </div>
    </div>
  );
  return <div className="absolute inset-0 bg-black"><div id="reels-feed" onWheel={handleWheel} className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain touch-pan-y">{reels.length ? reels.map((reel, index) => <section key={reel.id} data-reel-index={index} className="h-full w-full snap-start"><ReelItem reel={reel} active={index === activeIndex} forcePause={forcePause} preload={Math.abs(index - activeIndex) <= 2} onLikeChange={updateLike} onFavoriteChange={updateFavorite} onDeleted={handleDeleted} onFollowed={handleFollowed} onCommentCountChange={updateCommentCount} /></section>) : <div className="flex h-full items-center justify-center text-white">No reels yet. Be the first to post one.</div>}</div><button type="button" onClick={handleUpload} aria-label="Upload reel" title="Upload reel" className="absolute right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white shadow-lg ring-1 ring-white/20"><PlusIcon /></button><input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleFilePicked(file); }} /></div>;
}
