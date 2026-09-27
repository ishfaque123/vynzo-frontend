'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ShareModal from './ShareModal';
import { toggleReelLike } from '@/lib/api/reelApi';

function Avatar({ url, name }: { url?: string; name?: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center text-xs font-semibold text-slate-600" style={url ? { backgroundImage: `url(${url})` } : {}}>
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}
function MuteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
function UnmuteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 010 7" /><path d="M18.5 5.5a9 9 0 010 13" />
    </svg>
  );
}

export default function FeedReelCard({ reel }: { reel: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(!!reel.liked);
  const [likeCount, setLikeCount] = useState(Number(reel.likeCount || 0));
  const [liking, setLiking] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0].isIntersecting),
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
      // Reset to muted once it's scrolled away, so the next reel that
      // scrolls into view always starts muted (required for autoplay).
      video.muted = true;
      setIsMuted(true);
    }
  }, [inView]);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (liking) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    setLiking(true);
    const result = await toggleReelLike(reel.id);
    setLiking(false);
    if (result.success) {
      setLiked(!!result.data.liked);
      setLikeCount(Number(result.data.likeCount || 0));
    } else {
      setLiked(!nextLiked);
      setLikeCount((count) => Math.max(0, count + (nextLiked ? -1 : 1)));
    }
  }

  function openComments(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = '/reels?id=' + encodeURIComponent(reel.id);
  }

  function openShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  }

  function toggleMute(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  return (
    <>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar url={reel.author.profilePictureUrl} name={reel.author.displayName} />
        <span className="text-sm font-semibold text-slate-800">{reel.author.displayName}</span>
      </div>
      <div ref={containerRef} className="relative aspect-[9/16] max-h-[420px] w-full bg-black">
        <video
          ref={videoRef}
          src={`${reel.videoUrl}#t=0.1`}
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 via-black/25 to-transparent px-3 pb-8 pt-2">
          {reel.caption ? (
            <p className="max-w-[80%] text-sm text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">{reel.caption}</p>
          ) : <span />}
          <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">Reel</span>
        </div>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60"
        >
          {isMuted ? <MuteIcon /> : <UnmuteIcon />}
        </button>
      </div>
      <div className="flex items-center border-t border-slate-100 px-2 py-1">
        <button type="button" onClick={handleLike} disabled={liking} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium active:bg-slate-100 ${liked ? 'text-rose-500' : 'text-slate-600'}`}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button type="button" onClick={openComments} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-slate-600 active:bg-slate-100">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-4.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
          {Number(reel.commentCount || 0) > 0 && <span>{reel.commentCount}</span>}
        </button>
        <button type="button" onClick={openShare} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-slate-600 active:bg-slate-100">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><line x1="8.3" y1="10.7" x2="15.7" y2="6.3" /><line x1="8.3" y1="13.3" x2="15.7" y2="17.7" /></svg>
          Share
        </button>
      </div>
    </div>
    {shareOpen && <ShareModal onClose={() => setShareOpen(false)} reelId={reel.id} />}
    </>
  );
}
