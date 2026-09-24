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
