'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { toggleFollow } from '@/lib/api/userApi';
import ShareModal from '@/components/ShareModal';
import ReelCommentsModal from '@/components/ReelCommentsModal';
import { fetchReelsConfig, fetchReelFeed, fetchMyReelStatus, toggleReelLike, toggleReelFavorite, deleteReel } from '@/lib/api/reelApi';
import { fetchReelComments } from '@/lib/api/reelCommentApi';
import { setPendingReelVideo } from '@/lib/pendingReelVideo';

interface Reel { id: string; videoUrl: string; caption: string | null; durationSec: number | null; createdAt: string; likeCount: number; liked: boolean; favorited: boolean; isMine: boolean; friendStatus?: string; commentCount?: number; author: { id: string; username: string; displayName: string; profilePictureUrl?: string }; }
function HeartIcon({ filled, size = 30 }: { filled: boolean; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#f43f5e' : 'none'} stroke={filled ? '#f43f5e' : 'white'} strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>; }
function PlayIcon({ playing }: { playing: boolean }) { return playing ? <svg width="38" height="38" viewBox="0 0 24 24" fill="white"><rect x="5" y="4" width="5" height="16" rx="1" /><rect x="14" y="4" width="5" height="16" rx="1" /></svg> : <svg width="38" height="38" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>; }
function SeekIcon({ forward }: { forward: boolean }) { return <div className="relative flex h-14 w-14 items-center justify-center"><svg width="50" height="50" viewBox="0 0 42 42" fill="none" stroke="white" strokeWidth="2.2"><path d={forward ? 'M18 10a12 12 0 11-8.4 20.5' : 'M24 10a12 12 0 11-8.4 20.5'} /><path d={forward ? 'M25 6l-1 7 7-1' : 'M17 6l1 7-7-1'} /></svg><span className="absolute text-[10px] font-bold text-white">10</span></div>; }
function TrashIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>; }
function MuteIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>; }
function UnmuteIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 11 5" /><path d="M15.5 8.5a5 5 0 010 7" /><path d="M18.5 5.5a9 9 0 010 13" /></svg>; }
function PlusIcon() { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function ShareIcon() { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><line x1="8.3" y1="10.7" x2="15.7" y2="6.3" /><line x1="8.3" y1="13.3" x2="15.7" y2="17.7" /></svg>; }
function BookmarkIcon({ filled }: { filled: boolean }) { return <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? 'white' : 'none'} stroke="white" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" /></svg>; }
function BackIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>; }
function CommentIcon() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>; }

type HeartBurst = { id: number; left: number; top: number };

function ReelItem({ reel, active, forcePause, onLikeChange, onFavoriteChange, onDeleted, onFollowed, onCommentCountChange, onNext }: { reel: Reel; active: boolean; forcePause: boolean; onLikeChange: (id: string, liked: boolean, count: number) => void; onFavoriteChange: (id: string, favorited: boolean) => void; onDeleted: (id: string) => void; onFollowed: (userId: string) => void; onCommentCountChange: (id: string, delta: number) => void; onNext: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef(0);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liking, setLiking] = useState(false);
  const [following, setFollowing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [heartBursts, setHeartBursts] = useState<HeartBurst[]>([]);
  const [showControls, setShowControls] = useState(false);
  const [seekFeedback, setSeekFeedback] = useState<'back' | 'forward' | null>(null);
  const { user: currentUser } = useAuth();

  function revealControls() { setShowControls(true); if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500); }
  useEffect(() => () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); heartTimersRef.current.forEach(clearTimeout); }, []);
  async function openComments() { setCommentsOpen(true); const result = await fetchReelComments(reel.id); if (result.success) setComments(result.data.comments || []); }
  useEffect(() => { function refresh(e: Event) { const detail = (e as CustomEvent).detail; if (detail === reel.id && commentsOpen) void openComments(); } window.addEventListener('reel-comments-refresh', refresh); return () => window.removeEventListener('reel-comments-refresh', refresh); }, [reel.id, commentsOpen]);
  const showFollow = !reel.isMine && (reel.friendStatus === 'none' || reel.friendStatus === 'follow_back');
  async function handleFollow(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); if (following) return; setFollowing(true); const result = await toggleFollow(reel.author.id); setFollowing(false); if (result.success && result.data.following) onFollowed(reel.author.id); }
  useEffect(() => { const video = videoRef.current; if (!video || !active) return; video.currentTime = 0; video.muted = false; setIsMuted(false); setShowControls(false); setIsPlaying(false); video.play().then(() => setIsPlaying(true)).catch(() => { video.muted = true; setIsMuted(true); video.play().then(() => setIsPlaying(true)).catch(() => {}); }); }, [active]);
  useEffect(() => { const video = videoRef.current; if (!video) return; if (!active || forcePause) { video.pause(); setIsPlaying(false); } else if (video.paused) { video.play().then(() => setIsPlaying(true)).catch(() => {}); } }, [active, forcePause]);
  function toggleMute(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); const video = videoRef.current; if (!video) return; video.muted = !video.muted; setIsMuted(video.muted); }
  function togglePlayback(e?: React.MouseEvent) { e?.preventDefault(); e?.stopPropagation(); const video = videoRef.current; if (!video) return; if (video.paused) { video.play().then(() => setIsPlaying(true)).catch(() => {}); } else { video.pause(); setIsPlaying(false); } revealControls(); }
  function seek(seconds: number, e?: React.MouseEvent) { e?.preventDefault(); e?.stopPropagation(); const video = videoRef.current; if (!video) return; const duration = Number.isFinite(video.duration) ? video.duration : 0; video.currentTime = Math.max(0, Math.min(duration || Infinity, video.currentTime + seconds)); setSeekFeedback(seconds > 0 ? 'forward' : 'back'); window.setTimeout(() => setSeekFeedback(null), 550); revealControls(); }
  function handleVideoTap(e: React.MouseEvent<HTMLVideoElement>) {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0; e.preventDefault(); e.stopPropagation();
      if (!reel.liked && !liking) void handleLike();
      const burst: HeartBurst = { id: Date.now() + Math.random(), left: 42 + Math.random() * 16, top: 38 + Math.random() * 22 };
      setHeartBursts((items) => [...items, burst]);
      const timer = window.setTimeout(() => setHeartBursts((items) => items.filter((item) => item.id !== burst.id)), 700);
      heartTimersRef.current.push(timer);
      return;
    }
    lastTapRef.current = now;
    window.setTimeout(() => { if (lastTapRef.current !== now) return; lastTapRef.current = 0; revealControls(); }, 300);
  }
  async function handleLike() { if (liking) return; setLiking(true); const nextLiked = !reel.liked; onLikeChange(reel.id, nextLiked, Math.max(0, reel.likeCount + (nextLiked ? 1 : -1))); const result = await toggleReelLike(reel.id); setLiking(false); if (result.success) onLikeChange(reel.id, result.data.liked, Math.max(0, reel.likeCount + (result.data.liked ? 1 : -1))); }
  async function handleFavorite() { if (favoriting) return; setFavoriting(true); onFavoriteChange(reel.id, !reel.favorited); const result = await toggleReelFavorite(reel.id); setFavoriting(false); if (result.success) onFavoriteChange(reel.id, result.data.favorited); }
  async function handleDelete() { if (!confirm('Delete this reel?')) return; const result = await deleteReel(reel.id); if (result.success) onDeleted(reel.id); }

  return <div className="relative flex h-full w-full flex-shrink-0 items-center justify-center bg-black">
    <video ref={videoRef} src={reel.videoUrl} playsInline muted={isMuted} className="h-full w-full select-none object-contain" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }} onContextMenu={(e) => e.preventDefault()} onClick={handleVideoTap} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={onNext} />
    {heartBursts.map((burst) => <div key={burst.id} className="pointer-events-none absolute z-30" style={{ left: `${burst.left}%`, top: `${burst.top}%`, transform: 'translate(-50%, -50%)' }}><div className="animate-[ping_700ms_ease-out_1] drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]"><HeartIcon filled size={105} /></div></div>)}
    {seekFeedback && <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"><div className="text-base font-bold text-white drop-shadow-lg">{seekFeedback === 'forward' ? '+10 sec' : '-10 sec'}</div></div>}
    <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} className="absolute right-4 top-20 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/60">{isMuted ? <MuteIcon /> : <UnmuteIcon />}</button>
    {showControls && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"><div className="pointer-events-auto flex items-center gap-8 px-4 py-3"><button aria-label="Back 10 seconds" onClick={(e) => seek(-10, e)} className="flex h-14 w-14 items-center justify-center"><SeekIcon forward={false} /></button><button aria-label={isPlaying ? 'Pause' : 'Play'} onClick={togglePlayback} className="flex h-14 w-14 items-center justify-center"><PlayIcon playing={isPlaying} /></button><button aria-label="Forward 10 seconds" onClick={(e) => seek(10, e)} className="flex h-14 w-14 items-center justify-center"><SeekIcon forward /></button></div></div>}
    <div className="absolute bottom-0 left-0 right-16 z-10 p-4 pb-6 text-white"><div className="relative mb-2 flex items-center gap-2"><Link href={`/u/${reel.author.username}`} className="flex min-w-0 items-center gap-2"><span className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-white/60 bg-slate-600 bg-cover bg-center" style={reel.author.profilePictureUrl ? { backgroundImage: `url(${reel.author.profilePictureUrl})` } : {}} /><span className="text-sm font-semibold">{reel.author.displayName}</span></Link>{showFollow && <button type="button" onClick={handleFollow} disabled={following} aria-label="Follow" className="absolute left-4 top-8 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-md disabled:opacity-50"><span className="text-[10px] font-bold">+</span></button>}</div>{reel.caption && <p className="text-sm">{reel.caption}</p>}</div>
    <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-5"><button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="flex flex-col items-center gap-1"><HeartIcon filled={reel.liked} /><span className="text-xs font-medium text-white">{reel.likeCount}</span></button><button onClick={(e) => { e.stopPropagation(); openComments(); }} className="flex flex-col items-center gap-1"><CommentIcon /><span className="text-xs font-medium text-white">{reel.commentCount ?? ''}</span></button><button onClick={(e) => { e.stopPropagation(); handleFavorite(); }} className="flex flex-col items-center gap-1"><BookmarkIcon filled={reel.favorited} /></button><button onClick={(e) => { e.stopPropagation(); setShareOpen(true); }} className="flex flex-col items-center gap-1"><ShareIcon /></button>{reel.isMine && <button onClick={handleDelete} className="flex flex-col items-center gap-1"><TrashIcon /></button>}</div>
    {shareOpen && <ShareModal reelId={reel.id} onClose={() => setShareOpen(false)} />}
    {commentsOpen && <ReelCommentsModal reelId={reel.id} reelOwner={reel.isMine} currentUserId={currentUser?.id} comments={comments} onClose={() => setCommentsOpen(false)} onCountChange={(delta) => onCommentCountChange(reel.id, delta)} />}
  </div>;
}

export default function ReelsPage() {
  const { user } = useAuth(); const router = useRouter();
  const [config, setConfig] = useState<{ enabled: boolean; maxDurationSec: number; dailyLimit: number } | null>(null);
  const [reels, setReels] = useState<Reel[]>([]); const [loading, setLoading] = useState(true); const [offset, setOffset] = useState(0); const [hasMore, setHasMore] = useState(true); const [loadingMore, setLoadingMore] = useState(false); const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null); const itemRefs = useRef<(HTMLDivElement | null)[]>([]); const fileInputRef = useRef<HTMLInputElement>(null); const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => { fetchReelsConfig().then((res) => { if (res.success) setConfig(res.data); }); }, []);
  function loadFeed() { setLoading(true); fetchReelFeed(0).then((res) => { if (res.success) { setReels(res.data.reels); setHasMore(!!res.data.hasMore); setOffset(res.data.reels.length); } setLoading(false); }); }
  useEffect(() => { if (config?.enabled) loadFeed(); }, [config?.enabled]);
  async function loadMore() { if (loadingMore || !hasMore) return; setLoadingMore(true); const res = await fetchReelFeed(offset); setLoadingMore(false); if (res.success) { setReels((prev) => { const ids = new Set(prev.map((r) => r.id)); return [...prev, ...res.data.reels.filter((r: Reel) => !ids.has(r.id))]; }); setHasMore(!!res.data.hasMore); setOffset((o) => o + res.data.reels.length); } }
  useEffect(() => { const el = sentinelRef.current; if (!el) return; const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: '600px' }); observer.observe(el); return () => observer.disconnect(); }, [offset, hasMore, loadingMore]);
  useEffect(() => { const container = containerRef.current; if (!container) return; const observer = new IntersectionObserver((entries) => { for (const entry of entries) if (entry.isIntersecting) { const idx = itemRefs.current.findIndex((el) => el === entry.target); if (idx !== -1) setActiveIndex(idx); } }, { root: container, threshold: 0.65 }); itemRefs.current.forEach((el) => el && observer.observe(el)); return () => observer.disconnect(); }, [reels.length]);
  function handleLikeChange(id: string, liked: boolean, count: number) { setReels((prev) => prev.map((r) => r.id === id ? { ...r, liked, likeCount: Math.max(0, count) } : r)); }
  function handleFavoriteChange(id: string, favorited: boolean) { setReels((prev) => prev.map((r) => r.id === id ? { ...r, favorited } : r)); }
  function handleDeleted(id: string) { setReels((prev) => prev.filter((r) => r.id !== id)); }
  function updateCommentCount(id: string, delta: number) { setReels((prev) => prev.map((r) => r.id === id ? { ...r, commentCount: Math.max(0, (r.commentCount ?? 0) + delta) } : r)); }
  function scrollToIndex(index: number) { const target = itemRefs.current[index]; if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  async function openUpload() { const status = await fetchMyReelStatus(); if (status.success && status.data.remaining === 0) { alert("You've already posted your reel for today. Come back tomorrow!"); return; } fileInputRef.current?.click(); }
  function handleFilePicked(file: File) { const probe = document.createElement('video'); probe.preload = 'metadata'; probe.onloadedmetadata = () => { URL.revokeObjectURL(probe.src); const maxDuration = config?.maxDurationSec ?? 60; if (probe.duration > maxDuration) { alert(`Reels must be ${maxDuration} seconds or shorter.`); return; } setPendingReelVideo(file, probe.duration); router.push('/reels/new'); }; probe.src = URL.createObjectURL(file); }
  if (!config) return <div className="flex min-h-[70vh] items-center justify-center text-slate-500">Loading...</div>;
  if (!config.enabled) return <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center text-slate-500"><p className="text-lg font-semibold text-slate-700">Reels are unavailable right now</p><p className="mt-2 text-sm">Please check back later.</p></div>;
  return <div className="fixed inset-0 z-0 h-[100dvh] bg-black">{loading ? <div className="flex h-full items-center justify-center text-white">Loading...</div> : reels.length === 0 ? <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-white"><p>No reels yet. Be the first to post one!</p></div> : <div ref={containerRef} className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain scroll-smooth" style={{ scrollSnapType: 'y mandatory' }}>{reels.map((reel, i) => <div key={reel.id} ref={(el) => { itemRefs.current[i] = el; }} className="h-[100dvh] w-full snap-start" style={{ scrollSnapStop: 'always' }}><ReelItem reel={reel} active={i === activeIndex} forcePause={false} onLikeChange={handleLikeChange} onFavoriteChange={handleFavoriteChange} onDeleted={handleDeleted} onCommentCountChange={updateCommentCount} onNext={() => { if (i < reels.length - 1) scrollToIndex(i + 1); else if (hasMore) loadMore(); }} onFollowed={(userId) => setReels((prev) => prev.map((r) => r.author.id === userId ? { ...r, friendStatus: r.friendStatus === 'follow_back' ? 'friends' : 'following' } : r))} /></div>)}<div ref={sentinelRef} className="h-1 w-full" /></div>}
    <button onClick={() => router.back()} aria-label="Back" className="absolute left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/20"><BackIcon /></button>
    <button onClick={openUpload} aria-label="Post a reel" className="absolute right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/20"><PlusIcon /></button>
    <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleFilePicked(file); }} />
  </div>;
}
