'use client';

import { useState, useEffect, useRef } from 'react';
import { sharePost } from '@/lib/api/postApi';
import { createShareLink } from '@/lib/api/shareApi';

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm0 18a8 8 0 01-4.2-1.2l-.3-.2-3 .9.9-2.9-.2-.3A8 8 0 1112 20z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z" />
    </svg>
  );
}
function RepostIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

interface ShareModalProps {
  onClose: () => void;
  postId?: string;
  profileUsername?: string;
  profileId?: string;
}

const CLOSE_THRESHOLD_PX = 100;

export default function ShareModal({ postId, profileUsername, profileId, onClose }: ShareModalProps) {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const fallbackUrl = profileUsername
    ? `${origin}/u/${profileUsername}`
    : `${origin}/post/${postId}`;
  const url = shareCode ? `${origin}/s/${shareCode}` : fallbackUrl;

  useEffect(() => {
    const targetType = profileUsername ? 'profile' : 'post';
    const targetId = profileUsername ? profileId : postId;
    if (!targetId) return;
    createShareLink(targetType, targetId).then((result) => {
      if (result.success) setShareCode(result.data.code);
    });
  }, [profileUsername, profileId, postId]);

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareTo(platform: string) {
    let shareUrl = '';
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (shareUrl) window.open(shareUrl, '_blank');
    onClose();
  }

  async function handleRepost() {
    if (!postId) return;
    setSharing(true);
    const result = await sharePost(postId, '');
    setSharing(false);
    onClose();
    if (result.success) window.location.reload();
    else alert(result.error.message);
  }

  function dragStart(clientY: number) {
    draggingRef.current = true;
    startYRef.current = clientY;
  }
  function dragMove(clientY: number) {
    if (!draggingRef.current) return;
    setDragY(Math.max(0, clientY - startYRef.current));
  }
  function dragEnd() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragY((current) => {
      if (current > CLOSE_THRESHOLD_PX) onClose();
      return 0;
    });
  }

  function listTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
    draggingRef.current = false;
  }
  function listTouchMove(e: React.TouchEvent) {
    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;
    const el = listRef.current;
    if (!draggingRef.current) {
      if (delta > 0 && el && el.scrollTop <= 0) {
        draggingRef.current = true;
      } else {
        return;
      }
    }
    e.preventDefault();
    setDragY(Math.max(0, delta));
  }
  function listTouchEnd() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragY((current) => {
      if (current > CLOSE_THRESHOLD_PX) onClose();
      return 0;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-t-2xl bg-white"
        style={{ transform: `translateY(${dragY}px)`, transition: dragY === 0 ? 'transform 0.2s ease' : 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex cursor-grab flex-col items-center pt-2 pb-1 active:cursor-grabbing"
          onTouchStart={(e) => dragStart(e.touches[0].clientY)}
          onTouchMove={(e) => dragMove(e.touches[0].clientY)}
          onTouchEnd={dragEnd}
          onMouseDown={(e) => dragStart(e.clientY)}
          onMouseMove={(e) => dragMove(e.clientY)}
          onMouseUp={dragEnd}
          onMouseLeave={dragEnd}
        >
          <span className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        <div
          ref={listRef}
          className="overflow-y-auto overscroll-contain px-2 pb-6"
          onTouchStart={listTouchStart}
          onTouchMove={listTouchMove}
          onTouchEnd={listTouchEnd}
        >
          <p className="px-4 py-2 font-semibold">{profileUsername ? 'Share profile' : 'Share'}</p>

          <div className="mx-4 mb-3 rounded-lg border p-2.5">
            <p className="break-all text-sm leading-snug text-slate-600">{url}</p>
            <button onClick={copyLink} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">
              <LinkIcon /> {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          {postId && (
            <button onClick={handleRepost} disabled={sharing} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-100">
              <span className="text-slate-600"><RepostIcon /></span>
              <span className="text-slate-800">Repost to your feed</span>
            </button>
          )}
          <button onClick={() => shareTo('whatsapp')} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-100">
            <span className="text-slate-600"><WhatsAppIcon /></span>
            <span className="text-slate-800">Share to WhatsApp</span>
          </button>
          <button onClick={() => shareTo('facebook')} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-100">
            <span className="text-slate-600"><FacebookIcon /></span>
            <span className="text-slate-800">Share to Facebook</span>
          </button>
        </div>
      </div>
    </div>
  );
}
