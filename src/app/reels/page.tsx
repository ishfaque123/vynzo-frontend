'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { toggleFollow, fetchFollowStatus } from '@/lib/api/userApi';
import ShareModal from '@/components/ShareModal';
import ReelCommentsModal from '@/components/ReelCommentsModal';
import ReelReportModal from '@/components/ReelReportModal';
import { fetchReelsConfig, fetchReelFeed, fetchMyReelStatus, toggleReelLike, toggleReelFavorite, deleteReel, recordReelView, fetchReelById, getReelDownloadUrl } from '@/lib/api/reelApi';
import { fetchReelComments } from '@/lib/api/reelCommentApi';
import { setPendingReelVideo } from '@/lib/pendingReelVideo';
import { cacheReelVideo, getOfflineReels } from '@/lib/offline/reelCache';
import VerifiedBadge from '@/components/VerifiedBadge';
import Skeleton from '@/components/Skeleton';

interface Reel { id: string; videoUrl: string; caption: string | null; durationSec: number | null; createdAt: string; likeCount: number; liked: boolean; favorited: boolean; isMine: boolean; friendStatus?: string; commentCount?: number; author: { id: string; username: string; displayName: string; profilePictureUrl?: string; isVerified?: boolean }; }
function HeartIcon({ filled, size = 30 }: { filled: boolean; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#f43f5e' : 'none'} stroke={filled ? '#f43f5e' : 'white'} strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>; }
function PlayIcon({ playing }: { playing: boolean }) { return playing ? <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg> : <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M8 5.8v12.4c0 .8.9 1.3 1.6.9l9.4-6.2a1.1 1.1 0 000-1.8L9.6 4.9C8.9 4.5 8 5 8 5.8z" /></svg>; }
function MoreIcon() { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><circle cx="5" cy="12" r="1.2" fill="white" /><circle cx="12" cy="12" r="1.2" fill="white" /><circle cx="19" cy="12" r="1.2" fill="white" /></svg>; }
function MuteIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>; }
function UnmuteIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 010 7" /><path d="M18.5 5.5a9 9 0 010 13" /></svg>; }
function ReelNotice({ message, confirm, onClose, onConfirm }: { message: string; confirm?: boolean; onClose: () => void; onConfirm?: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-5 backdrop-blur-sm" onClick={onClose}>
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" onClick={(e) => e.stopPropagation()}>
      <div className="mb-3 flex items-center gap-3">
        <img src="/logo.png" alt="Frianzo" className="h-9 w-9 object-contain" />
        <h3 className="text-base font-semibold">{confirm ? 'Confirm action' : 'Frianzo'}</h3>
      </div>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        {confirm && <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>}
        <button type="button" onClick={confirm ? onConfirm : onClose} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100">{confirm ? 'Delete' : 'OK'}</button>
      </div>
    </div>
  </div>;
}


function ReelOptionIcon({ type }: { type: 'interested' | 'not-interested' | 'save' | 'copy' | 'download' | 'delete' | 'report' }) {
  const paths = {
    interested: <path d="M20 6L9 17l-5-5" />,
    'not-interested': <><circle cx="12" cy="12" r="9" /><line x1="8" y1="8" x2="16" y2="16" /></>,
    save: <path d="M6 4a2 2 0 012-2h8a2 2 0 012 2v18l-6-4-6 4V4z" />,
    download: <path d="M12 3v12m0 0l-5-5m5 5l5-5M5 20h14" />,
    copy: <><rect x="8" y="8" width="11" height="12" rx="2" /><path d="M5 16H4a2 2 0 01-2-2V4a2 2 0 012-2h8a2 2 0 012 2v1" /></>,
    delete: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M7 7l1 14h8l1-14" /></>,
    report: <><path d="M5 21V4" /><path d="M5 5c4-3 6 3 14 0v9c-8 3-10-3-14 0" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

function ReelMoreOptionsSheet({ isMine, favorited, loading, onInterested, onNotInterested, onSave, onCopyLink, onSaveVideo, onDelete, onReport, onClose }: { isMine: boolean; favorited: boolean; loading: boolean; onInterested: () => void; onNotInterested: () => void; onSave: () => void; onCopyLink: () => void; onSaveVideo: () => void; onDelete: () => void; onReport: () => void; onClose: () => void }) {
  const [dragY, setDragY] = useState(0);
  const [pullStartY, setPullStartY] = useState<number | null>(null);
  const CLOSE_THRESHOLD = 100;

  function startPull(y: number) {
    setPullStartY(y);
    setDragY(0);
  }

  function movePull(e: React.TouchEvent<HTMLDivElement>) {
    if (pullStartY === null) return;
    const dy = e.touches[0].clientY - pullStartY;
    if (dy < 0) {
      setPullStartY(null);
      setDragY(0);
      return;
    }
    e.preventDefault();
    setDragY(dy);
  }

  function endPull() {
    if (pullStartY === null) return;
    const shouldClose = dragY > CLOSE_THRESHOLD;
    setPullStartY(null);
    setDragY(0);
    if (shouldClose) onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="flex w-full max-w-xl min-h-0 flex-col rounded-t-2xl bg-white shadow-2xl"
        style={{ height: 'auto', maxHeight: '78vh', transform: `translateY(${dragY}px)`, transition: pullStartY !== null ? 'none' : 'transform 0.2s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex flex-col items-center py-2"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => startPull(e.touches[0].clientY)}
          onTouchMove={movePull}
          onTouchEnd={endPull}
          onTouchCancel={() => { setPullStartY(null); setDragY(0); }}
        >
          <span className="h-1 w-10 rounded-full bg-slate-300" />
        </div>
        <div className="border-b border-slate-200 px-4 pb-3 text-center">
          <div className="text-sm font-semibold text-slate-900">More options</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Reel actions</div>
        </div>
        <div
          className="min-h-0 overflow-y-auto overscroll-contain px-3 py-3"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehaviorY: 'contain' }}
          onWheel={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="space-y-2 py-1" role="status" aria-label="Loading more options">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl px-3.5 py-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 flex-1 max-w-44" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              <button type="button" onClick={onInterested} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 active:bg-slate-200"><span className="text-slate-600"><ReelOptionIcon type="interested" /></span><span>Interested</span></button>
              <button type="button" onClick={onNotInterested} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 active:bg-slate-200"><span className="text-slate-600"><ReelOptionIcon type="not-interested" /></span><span>Not interested</span></button>
              <button type="button" onClick={onSave} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 active:bg-slate-200"><span className="text-slate-600"><ReelOptionIcon type="save" /></span><span>{favorited ? 'Remove from saved' : 'Save reel'}</span></button>
              <button type="button" onClick={onSaveVideo} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 active:bg-slate-200"><span className="text-slate-600"><ReelOptionIcon type="download" /></span><span>Save video</span></button>
              <button type="button" onClick={onCopyLink} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left text-sm font-medium text-slate-900 hover:bg-slate-100 active:bg-slate-200"><span className="text-slate-600"><ReelOptionIcon type="copy" /></span><span>Copy link</span></button>
              {isMine ? (
                <button type="button" onClick={onDelete} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100"><span><ReelOptionIcon type="delete" /></span><span>Delete reel</span></button>
              ) : (
                <button type="button" onClick={onReport} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100"><span><ReelOptionIcon type="report" /></span><span>Report reel</span></button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlusIcon() { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function ShareIcon() { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><line x1="8.3" y1="10.7" x2="15.7" y2="6.3" /><line x1="8.3" y1="13.3" x2="15.7" y2="17.7" /></svg>; }
function CommentIcon() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>; }

type HeartBurst = { id: number; left: number; top: number };

function getNotInterestedIds(): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem('frianzo_reel_interest_feedback') || '{}');
    return new Set(Object.keys(saved).filter((id) => saved[id] === 'not_interested'));
  } catch {
    return new Set();
  }
}

function ReelItem({ reel, active, forcePause, preload, cacheUserId, offlineMode, onLikeChange, onFavoriteChange, onDeleted, onFollowed, onCommentCountChange }: { reel: Reel; active: boolean; forcePause: boolean; preload: boolean; cacheUserId?: string; offlineMode?: boolean; onLikeChange: (id: string, liked: boolean, count: number) => void; onFavoriteChange: (id: string, favorited: boolean) => void; onDeleted: (id: string) => void; onFollowed: (userId: string) => void; onCommentCountChange: (id: string, delta: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef(0);
  const userPausedRef = useRef(false);
  const [videoError, setVideoError] = useState<number | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartTimersRef = useRef<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [progress, setProgress] = useState(0);
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
  const [cachedOffline, setCachedOffline] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [notice, setNotice] = useState<{ message: string; confirm: boolean } | null>(null);
  const [downloadState, setDownloadState] = useState<{ active: boolean; progress: number; status: 'idle' | 'downloading' | 'complete' | 'error' }>({ active: false, progress: 0, status: 'idle' });
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreOptionsLoaded, setMoreOptionsLoaded] = useState(false);
  const [moreOptionsLoading, setMoreOptionsLoading] = useState(false);
  const moreOptionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user: currentUser } = useAuth();
  const CAPTION_LIMIT = 80;
  const captionLong = (reel.caption?.length || 0) > CAPTION_LIMIT;
  const captionShown = !captionLong || captionExpanded ? reel.caption : `${reel.caption!.slice(0, CAPTION_LIMIT)}...`;

  function revealControls() { setShowControls(true); if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500); }
  useEffect(() => () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); if (moreOptionsTimerRef.current) clearTimeout(moreOptionsTimerRef.current); heartTimersRef.current.forEach((timer) => window.clearTimeout(timer)); }, []);
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
  useEffect(() => {
    if (!active) return;
    void recordReelView(reel.id).then((result) => {
      if (result.success) setViewCount(Number(result.data?.viewCount || 0));
    });
  }, [active, reel.id]);
  useEffect(() => {
    if (!active || !cacheUserId || !reel.videoUrl || reel.videoUrl.startsWith('blob:')) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void cacheReelVideo(cacheUserId, reel).then((saved) => {
        if (!cancelled && saved) setCachedOffline(true);
      });
    }, 2500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [active, cacheUserId, reel]);
  const showFollow = !reel.isMine && (reel.friendStatus === 'none' || reel.friendStatus === 'follow_back');
  async function handleFollow(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); if (following) return; setFollowing(true); const result = await toggleFollow(reel.author.id); setFollowing(false); if (result.success && result.data.following) onFollowed(reel.author.id); }
  useEffect(() => { const video = videoRef.current; if (!video) return; if (preload) { if (video.getAttribute('src') !== reel.videoUrl) video.setAttribute('src', reel.videoUrl); } else if (video.getAttribute('src')) { video.pause(); video.removeAttribute('src'); video.load(); setIsPlaying(false); } }, [preload, reel.videoUrl]);
  useEffect(() => { const video = videoRef.current; if (!video) return; if (!active) { video.pause(); setIsPlaying(false); setProgress(0); return; } video.currentTime = 0; userPausedRef.current = false; setVideoError(null); setShowControls(false); setIsPlaying(false); setIsVideoLoading(video.readyState < 3); setProgress(0); let cancelled = false; (async () => { for (let attempt = 0; attempt < 4 && !cancelled; attempt++) { try { video.muted = true; setIsMuted(true); await video.play(); if (cancelled) return; video.muted = false; setIsMuted(false); if (video.paused) { video.muted = true; setIsMuted(true); await video.play(); } setIsPlaying(true); return; } catch { if (video.error) return; await new Promise((resolve) => setTimeout(resolve, 250)); } } })(); return () => { cancelled = true; }; }, [active]);
  useEffect(() => { const video = videoRef.current; if (!video || !active) return; if (forcePause) { video.pause(); setIsPlaying(false); } else if (video.paused) { video.play().then(() => setIsPlaying(true)).catch(() => {}); } }, [forcePause]);
  function toggleMute(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); const video = videoRef.current; if (!video) return; video.muted = !video.muted; setIsMuted(video.muted); }
  function togglePlayback(e?: React.MouseEvent) { e?.preventDefault(); e?.stopPropagation(); const video = videoRef.current; if (!video) return; if (video.paused) { userPausedRef.current = false; video.play().then(() => setIsPlaying(true)).catch(() => {}); } else { userPausedRef.current = true; video.pause(); setIsPlaying(false); } revealControls(); }
  function handleVideoTap(e: React.MouseEvent<HTMLVideoElement>) { const now = Date.now(); if (now - lastTapRef.current < 300) { lastTapRef.current = 0; e.preventDefault(); e.stopPropagation(); if (!reel.liked && !liking) void handleLike(); const burst: HeartBurst = { id: Date.now() + Math.random(), left: 42 + Math.random() * 16, top: 38 + Math.random() * 22 }; setHeartBursts((items) => [...items, burst]); const timer = window.setTimeout(() => setHeartBursts((items) => items.filter((item) => item.id !== burst.id)), 700); heartTimersRef.current.push(timer); return; } lastTapRef.current = now; window.setTimeout(() => { if (lastTapRef.current !== now) return; lastTapRef.current = 0; revealControls(); }, 300); }
  async function handleLike() { if (liking) return; setLiking(true); const nextLiked = !reel.liked; const optimisticCount = Math.max(0, reel.likeCount + (nextLiked ? 1 : -1)); onLikeChange(reel.id, nextLiked, optimisticCount); const result = await toggleReelLike(reel.id); setLiking(false); if (result.success) onLikeChange(reel.id, result.data.liked, result.data.likeCount); else onLikeChange(reel.id, reel.liked, reel.likeCount); }
  async function handleFavorite() { if (favoriting) return; setFavoriting(true); onFavoriteChange(reel.id, !reel.favorited); const result = await toggleReelFavorite(reel.id); setFavoriting(false); if (result.success) onFavoriteChange(reel.id, result.data.favorited); else onFavoriteChange(reel.id, reel.favorited); }
  async function handleDelete() { setNotice({ message: 'Delete this reel? This action cannot be undone.', confirm: true }); }
  async function confirmDelete() { setNotice(null); const result = await deleteReel(reel.id); if (result.success) onDeleted(reel.id); else setNotice({ message: 'Something went wrong. Please try again.', confirm: false }); }
  async function copyReelLink() {
    const link = window.location.origin + '/reels?id=' + encodeURIComponent(reel.id);
    try { await navigator.clipboard.writeText(link); setMoreOpen(false); setNotice({ message: 'Link copied successfully.', confirm: false }); }
    catch { setMoreOpen(false); setNotice({ message: 'Couldn’t copy the link. Please try again.', confirm: false }); }
  }
  function handleSaveVideo() {
    setMoreOpen(false);
    const url = getReelDownloadUrl(reel.id);
    setDownloadState({ active: true, progress: 0, status: 'downloading' });
    setNotice(null);
    const native = (window as any).FrianzoNative;
    if (native?.startReelDownload) {
      const started = native.startReelDownload(url);
      if (started === false) setDownloadState({ active: true, progress: 0, status: 'error' });
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `frianzo-reel-${reel.id}.mp4`;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    function onDownload(e: Event) {
      const detail = (e as CustomEvent).detail || {};
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      if (detail.status === 'progress') {
        setDownloadState({ active: true, progress: Math.max(0, Math.min(99, Number(detail.progress) || 0)), status: 'downloading' });
      } else if (detail.status === 'complete') {
        setDownloadState({ active: true, progress: 100, status: 'complete' });
        hideTimer = setTimeout(() => {
          setDownloadState({ active: false, progress: 0, status: 'idle' });
          hideTimer = null;
        }, 1000);
      } else if (detail.status === 'error') {
        setDownloadState({ active: false, progress: 0, status: 'idle' });
      }
    }
    window.addEventListener('frianzo-download-progress', onDownload);
    return () => {
      window.removeEventListener('frianzo-download-progress', onDownload);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);
  function openMoreOptions() {
    setMoreOpen(true);
    if (moreOptionsLoaded) return;
    setMoreOptionsLoading(true);
    if (moreOptionsTimerRef.current) clearTimeout(moreOptionsTimerRef.current);
    moreOptionsTimerRef.current = setTimeout(() => {
      setMoreOptionsLoaded(true);
      setMoreOptionsLoading(false);
      moreOptionsTimerRef.current = null;
    }, 280);
  }
  function handleInterestChoice(interested: boolean) {
    try {
      const key = 'frianzo_reel_interest_feedback';
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      saved[reel.id] = interested ? 'interested' : 'not_interested';
      localStorage.setItem(key, JSON.stringify(saved));
    } catch {}
    setMoreOpen(false);
    if (interested) {
      setNotice({ message: 'Your preference has been saved.', confirm: false });
    } else {
      onDeleted(reel.id);
    }
  }

  return <div className="relative flex h-full w-full flex-shrink-0 items-center justify-center bg-black">
    <video ref={videoRef} playsInline controls={false} muted={isMuted} preload={preload ? 'auto' : 'none'} className="h-full w-full select-none object-contain" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }} onContextMenu={(e) => e.preventDefault()} onClick={handleVideoTap} onLoadStart={() => setIsVideoLoading(true)} onWaiting={() => setIsVideoLoading(true)} onCanPlay={(e) => { setIsVideoLoading(false); const v = e.currentTarget; if (active && !userPausedRef.current && !forcePause && v.paused) void v.play().then(() => setIsPlaying(true)).catch(() => {}); }} onPlaying={() => { setIsPlaying(true); setIsVideoLoading(false); setVideoError(null); }} onError={(e) => { setIsVideoLoading(false); setIsPlaying(false); setVideoError(e.currentTarget.error?.code || 4); }} onPause={(e) => { setIsPlaying(false); const v = e.currentTarget; if (active && !userPausedRef.current && !forcePause && !v.ended && !v.error && document.visibilityState === 'visible') { v.muted = true; setIsMuted(true); void v.play().catch(() => {}); } }} onEnded={(e) => { const video = e.currentTarget; video.currentTime = 0; void video.play().then(() => setIsPlaying(true)).catch(() => {}); }} onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) setProgress((v.currentTime / v.duration) * 100); }} />
    {active && isVideoLoading && <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"><div className="h-12 w-12 animate-[spin_0.8s_linear_infinite] rounded-full border-4 border-white/30 border-t-white" aria-label="Loading video" /></div>}
    {active && videoError && <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 px-6 text-center text-white"><p className="text-sm font-medium [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">This video can&apos;t be played right now.</p><button type="button" onClick={(e) => { e.stopPropagation(); const v = videoRef.current; if (!v) return; setVideoError(null); setIsVideoLoading(true); v.load(); void v.play().catch(() => {}); }} className="pointer-events-auto rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900">Try again</button><span className="text-[10px] text-white/60">Error code {videoError}</span></div>}
    {offlineMode && <div className="pointer-events-none absolute left-3 top-20 z-30 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">Offline</div>}
    {heartBursts.map((heart) => <div key={heart.id} className="pointer-events-none absolute z-30" style={{ left: `${heart.left}%`, top: `${heart.top}%`, transform: 'translate(-50%, -50%)' }}><div className="animate-[heartPop_700ms_ease-out_forwards] drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"><HeartIcon filled size={105} /></div></div>)}
    <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/25"><div className="h-full bg-white" style={{ width: `${progress}%` }} /></div>
    <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} className="absolute right-4 top-20 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/60">{isMuted ? <MuteIcon /> : <UnmuteIcon />}</button>
    {showControls && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"><div className="pointer-events-auto flex items-center gap-8 px-4 py-3"><button aria-label="Play or pause" onClick={togglePlayback} className="flex h-14 w-14 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm shadow-lg"><PlayIcon playing={isPlaying} /></button></div></div>}
    <div className="absolute bottom-2 left-0 right-16 z-10 p-4 pb-4 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]"><div className="relative mb-2 flex items-center gap-2"><Link href={`/u/${reel.author?.username}`} className="flex min-w-0 items-center gap-2"><span className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-white/60 bg-slate-600 bg-cover bg-center" style={reel.author?.profilePictureUrl ? { backgroundImage: `url(${reel.author.profilePictureUrl})` } : {}} /><span className="text-sm font-semibold">{reel.author?.displayName}</span>{reel.author?.isVerified && <VerifiedBadge size="sm" />}</Link>{showFollow && <button type="button" onClick={handleFollow} disabled={following} aria-label="Follow" className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-white disabled:opacity-50">Follow</button>}</div>{reel.caption && <p className="text-sm">{captionShown}{captionLong && <button onClick={(e) => { e.stopPropagation(); setCaptionExpanded((v) => !v); }} className="ml-1 font-semibold text-white/80">{captionExpanded ? 'less' : 'more'}</button>}</p>}<button type="button" onClick={(e) => { e.stopPropagation(); void openComments(); }} className="mt-3 flex w-full items-center rounded-full border border-white/30 bg-black/35 px-4 py-2.5 text-left text-sm text-white/75 backdrop-blur-sm transition hover:bg-black/45 active:scale-[0.99]" aria-label="Open comments"><span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/15"><CommentIcon /></span><span>Write a comment...</span></button></div>
    <div className="absolute bottom-6 right-3 z-20 flex flex-col items-center gap-4 pb-1 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] [&_svg]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"><button onClick={(e) => { e.stopPropagation(); void handleLike(); }} className="flex flex-col items-center gap-1"><HeartIcon filled={reel.liked} /><span className="text-xs font-medium text-white">{reel.likeCount}</span></button><button onClick={(e) => { e.stopPropagation(); void openComments(); }} className="flex flex-col items-center gap-1"><CommentIcon /><span className="text-xs font-medium text-white">{reel.commentCount || 0}</span></button><button onClick={(e) => { e.stopPropagation(); setShareOpen(true); }} className="flex flex-col items-center gap-1"><ShareIcon /><span className="text-xs font-medium text-white">Share</span></button><div className="flex flex-col items-center gap-1 text-white"><span className="text-xs font-medium">{viewCount}</span><span className="text-[10px]">Views</span></div><button type="button" onClick={(e) => { e.stopPropagation(); openMoreOptions(); }} aria-label="More options" aria-expanded={moreOpen} className="flex flex-col items-center gap-1"><MoreIcon /><span className="text-xs font-medium text-white">More</span></button></div>
    {moreOpen && <ReelMoreOptionsSheet
      isMine={reel.isMine}
      loading={moreOptionsLoading}
      favorited={reel.favorited}
      onInterested={() => handleInterestChoice(true)}
      onNotInterested={() => handleInterestChoice(false)}
      onSave={() => { setMoreOpen(false); void handleFavorite(); }}
      onCopyLink={() => { setMoreOpen(false); void copyReelLink(); }}
      onSaveVideo={handleSaveVideo}
      onDelete={() => { setMoreOpen(false); void handleDelete(); }}
      onReport={() => { setMoreOpen(false); setReportOpen(true); }}
      onClose={() => setMoreOpen(false)}
    />}
    {shareOpen && <ShareModal onClose={() => setShareOpen(false)} reelId={reel.id} />}
    {commentsOpen && <ReelCommentsModal onClose={() => setCommentsOpen(false)} reelId={reel.id} comments={comments} currentUserId={currentUser?.id || ''} reelOwner={reel.isMine} loading={commentsLoading} hasMore={commentsHasMore} loadingMore={commentsLoadingMore} onLoadMore={loadMoreComments} onCountChange={(delta) => onCommentCountChange(reel.id, delta)} />}
    {reportOpen && <ReelReportModal reelId={reel.id} onClose={() => setReportOpen(false)} />}
    {downloadState.active && downloadState.status === 'downloading' && <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[60] h-[3px] bg-white/20">
      <div className="h-full bg-blue-500 transition-[width] duration-200 ease-out" style={{ width: `${downloadState.progress}%` }} />
    </div>}
    {notice && <ReelNotice message={notice.message} confirm={notice.confirm} onClose={() => setNotice(null)} onConfirm={confirmDelete} />}
  </div>;
}

export default function ReelsPage() {
  const router = useRouter();
  const { user } = useAuth();
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
  const [feedError, setFeedError] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [forcePause] = useState(false);
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const targetId = new URLSearchParams(window.location.search).get('id');

      // Offline-first: read IndexedDB before waiting for any network request.
      // This makes previously cached reels usable even when Wi-Fi/mobile data is off.
      if (user?.id && !navigator.onLine) {
        const cached = await getOfflineReels(user.id);
        if (cancelled) return;
        if (cached.length) {
          setReels(cached.map((item) => ({ ...item.reel, videoUrl: item.videoUrl })));
          setOfflineMode(true);
          setFeedError(false);
          setHasMore(false);
          setLoading(false);
          return;
        }
      }

      const [targetResult, feed, status, config] = await Promise.all([
        targetId ? fetchReelById(targetId) : Promise.resolve(null),
        fetchReelFeed(),
        fetchMyReelStatus(),
        fetchReelsConfig(),
      ]);
      if (cancelled) return;

      let combined: Reel[] = feed.success ? (feed.data.reels || []) : [];
      let usingOfflineReels = false;

      if (!feed.success && user?.id) {
        const cached = await getOfflineReels(user.id);
        if (cached.length) {
          combined = cached.map((item) => ({ ...item.reel, videoUrl: item.videoUrl }));
          usingOfflineReels = true;
        }
      }

      setFeedError(!feed.success && !usingOfflineReels);
      setOfflineMode(usingOfflineReels);

      if (targetId && targetResult && targetResult.success && !usingOfflineReels) {
        const targetReel: Reel = targetResult.data.reel;
        combined = [targetReel, ...combined.filter((item) => item.id !== targetReel.id)];
      }

      // Defensive: a reel can come back without a populated author (e.g. the
      // author account was deleted). Drop those before anything below
      // assumes reel.author exists, instead of crashing the whole page.
      combined = combined.filter((item) => !!item?.author?.id);

      const notInterested = getNotInterestedIds();
      combined = combined.filter((item) => !notInterested.has(item.id));

      const authorIds = [...new Set(combined.filter((item: Reel) => !item.isMine).map((item: Reel) => item.author.id))] as string[];
      const statusResults: Array<[string, string] | null> = usingOfflineReels ? [] : await Promise.all(authorIds.map(async (userId) => {
        const result = await fetchFollowStatus(userId);
        const followStatus = result.success ? result.data?.status : null;
        return typeof followStatus === 'string' ? [userId, followStatus] : null;
      }));
      if (cancelled) return;

      const statusMap = new Map<string, string>();
      statusResults.forEach((item) => {
        if (item && typeof item[0] === 'string' && typeof item[1] === 'string') statusMap.set(item[0], item[1]);
      });

      setReels(combined.map((item: Reel) => statusMap.has(item.author.id) ? { ...item, friendStatus: statusMap.get(item.author.id) } : item));
      setHasMore(!usingOfflineReels && !!feed.data?.hasMore);

      const enabled = !!(config.success && config.data?.enabled);
      const remaining = status.success ? Number(status.data?.remaining) : 0;
      setReelsEnabled(enabled);
      setUploadMaxDuration(Number(config.data?.maxDurationSec) > 0 ? Number(config.data.maxDurationSec) : 60);
      setUploadReady(enabled && status.success && Number.isFinite(remaining) && remaining > 0);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user?.id]);
  useEffect(() => { const root = document.getElementById('reels-feed'); if (!root) return; const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reel-index]')); if (!items.length) return; const observer = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (!visible) return; const visibleIndex = Number((visible.target as HTMLElement).dataset.reelIndex); setActiveIndex(visibleIndex); if (visibleIndex >= reels.length - 3 && hasMore && !loadingMoreRef.current) { loadingMoreRef.current = true; void fetchReelFeed(reels.length).then((result) => { if (result.success) { setReels((items) => { const existingIds = new Set(items.map((item) => item.id)); const notInterested = getNotInterestedIds(); const newOnes = (result.data.reels || []).filter((item: Reel) => !existingIds.has(item.id) && !notInterested.has(item.id)); return [...items, ...newOnes]; }); setHasMore(!!result.data.hasMore); } }).finally(() => { loadingMoreRef.current = false; }); } }, { root, threshold: [0.6, 0.8, 1] }); items.forEach((item) => observer.observe(item)); return () => observer.disconnect(); }, [reels.length, hasMore]);
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
