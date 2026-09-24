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

export default function FeedReelCard({ reel }: { reel: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

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
    }
  }, [inView]);

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
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">Reel</span>
        {reel.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-3 pt-10">
            <p className="text-sm text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">{reel.caption}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
