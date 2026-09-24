'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

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

  function toggleMute(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  return (
    <Link href={`/reels?id=${reel.id}`} className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
    </Link>
  );
}
