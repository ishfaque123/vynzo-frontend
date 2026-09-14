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
function RepostIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function GridTile({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <span className="flex h-14 w-14 items-center justify-center rounded-full shadow-sm">{children}</span>
      <span className="max-w-[70px] text-center text-[11px] leading-tight text-slate-600">{label}</span>
    </button>
  );
}

function WhatsAppLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <defs>
        <linearGradient id="wa-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5BD066" />
          <stop offset="100%" stopColor="#27B43E" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="28" fill="url(#wa-grad)" />
      <path fill="white" d="M28 14a13.9 13.9 0 00-11.9 21.1L14.5 42l7.1-1.9A13.9 13.9 0 1028 14zm0 25.2a11.2 11.2 0 01-5.9-1.7l-.4-.2-4.2 1.1 1.1-4.1-.3-.4A11.2 11.2 0 1128 39.2zm6.1-8.4c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2s-1 1.1-1.2 1.3-.4.3-.8.1a9.2 9.2 0 01-2.7-1.7 10.1 10.1 0 01-1.9-2.3c-.2-.3 0-.5.1-.7l.5-.6.3-.5a.6.6 0 000-.6c-.1-.2-.8-1.9-1.1-2.6s-.6-.6-.8-.6h-.7a1.3 1.3 0 00-1 .5 4 4 0 00-1.2 3 6.9 6.9 0 001.5 3.7 15.9 15.9 0 006.1 5.4c.9.4 1.5.6 2.1.7a5 5 0 002.3.1 3.8 3.8 0 002.5-1.8 3 3 0 00.2-1.8c-.1-.1-.3-.2-.6-.4z" />
    </svg>
  );
}
function FacebookLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="28" fill="#1877F2" />
      <path fill="white" d="M31.5 29.5h4l.6-4.6h-4.6v-3c0-1.3.4-2.2 2.3-2.2h2.4v-4a33 33 0 00-3.5-.2c-3.5 0-5.9 2.1-5.9 6v3.4h-4v4.6h4V42h4.7V29.5z" />
    </svg>
  );
}
function MessengerLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <defs>
        <linearGradient id="msgr-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00C6FF" />
          <stop offset="50%" stopColor="#0068FF" />
          <stop offset="100%" stopColor="#B620E0" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="28" fill="url(#msgr-grad)" />
      <path fill="white" d="M28 15c-7.4 0-13 5.3-13 12.5 0 4.1 1.8 7.7 4.7 10.1v5l4.3-2.4c1.2.3 2.5.5 4 .5 7.4 0 13-5.3 13-12.5S35.4 15 28 15zm1.2 16.8l-3.3-3.5-6.4 3.5 7-7.4 3.4 3.5 6.3-3.5-7 7.4z" />
    </svg>
  );
}
function SmsLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="28" fill="#34C759" />
      <path fill="white" d="M28 16c-7.2 0-13 5-13 11.2 0 3.5 1.9 6.7 5 8.8v5.3l5-3c1 .2 2 .3 3 .3 7.2 0 13-5 13-11.4S35.2 16 28 16z" />
      <circle cx="22" cy="27" r="2" fill="#34C759" />
      <circle cx="28" cy="27" r="2" fill="#34C759" />
      <circle cx="34" cy="27" r="2" fill="#34C759" />
    </svg>
  );
}
function VynzoLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="28" fill="#0F172A" />
      <text x="28" y="36" textAnchor="middle" fontSize="24" fontWeight="700" fill="white" fontFamily="sans-serif">F</text>
    </svg>
  );
}

interface ShareModalProps {
  onClose: () => void;
  postId?: string;
  reelId?: string;
  profileUsername?: string;
  profileId?: string;
}

const CLOSE_THRESHOLD_PX = 100;

export default function ShareModal({ postId, reelId, profileUsername, profileId, onClose }: ShareModalProps) {
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
    : reelId
    ? `${origin}/s/reel-${reelId}`
    : `${origin}/post/${postId}`;
  const url = shareCode ? `${origin}/s/${shareCode}` : fallbackUrl;

  useEffect(() => {
    const targetType = profileUsername ? 'profile' : reelId ? 'reel' : 'post';
    const targetId = profileUsername ? profileId : reelId || postId;
    if (!targetId) return;
    createShareLink(targetType, targetId).then((result) => {
      if (result.success) setShareCode(result.data.code);
    });
  }, [profileUsername, profileId, reelId, postId]);

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openAndClose(target: string) {
    window.open(target, '_blank');
    onClose();
  }

  function shareWhatsApp() {
    openAndClose(`https://wa.me/?text=${encodeURIComponent(url)}`);
  }
  // WhatsApp/Facebook don't expose a public web link that posts directly
  // to Status/Stories — that's only possible from inside their own apps
  // via native SDKs. This opens the app (where installed) with the link
  // ready to share; the user still has to tap "Add to status" themselves.
  function shareWhatsAppStatus() {
    openAndClose(`whatsapp://send?text=${encodeURIComponent(url)}`);
  }
  function shareFacebook() {
    openAndClose(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  }
  function shareFacebookStatus() {
    openAndClose(`fb://story/camera?attachment_url=${encodeURIComponent(url)}`);
  }
  function shareMessenger() {
    openAndClose(`fb-messenger://share?link=${encodeURIComponent(url)}`);
  }
  function shareSms() {
    openAndClose(`sms:?body=${encodeURIComponent(url)}`);
  }
  function shareInternally() {
    onClose();
    window.location.href = `/messages/new?share=${encodeURIComponent(url)}`;
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
          className="overflow-y-auto overscroll-contain px-4 pb-6"
          onTouchStart={listTouchStart}
          onTouchMove={listTouchMove}
          onTouchEnd={listTouchEnd}
        >
          <p className="px-1 py-2 font-semibold">{profileUsername ? 'Share profile' : 'Share'}</p>

          <div className="mb-4 rounded-lg border p-2.5">
            <p className="break-all text-sm leading-snug text-slate-600">{url}</p>
            <button onClick={copyLink} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">
              <LinkIcon /> {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          <div className="mb-4 grid grid-cols-4 gap-y-4">
            <GridTile label="Friendzo DM" onClick={shareInternally}><VynzoLogo /></GridTile>
            <GridTile label="WhatsApp" onClick={shareWhatsApp}><WhatsAppLogo /></GridTile>
            <GridTile label="WhatsApp Status" onClick={shareWhatsAppStatus}><WhatsAppLogo /></GridTile>
            <GridTile label="Messenger" onClick={shareMessenger}><MessengerLogo /></GridTile>
            <GridTile label="Facebook" onClick={shareFacebook}><FacebookLogo /></GridTile>
            <GridTile label="Facebook Story" onClick={shareFacebookStatus}><FacebookLogo /></GridTile>
            <GridTile label="Text message" onClick={shareSms}><SmsLogo /></GridTile>
          </div>

          {postId && (
            <button onClick={handleRepost} disabled={sharing} className="flex w-full items-center gap-3 border-t px-1 py-3 text-left active:bg-slate-100">
              <span className="text-slate-600"><RepostIcon /></span>
              <span className="text-slate-800">Repost to your feed</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
