'use client';

import { useState } from 'react';
import { sharePost } from '@/lib/api/postApi';

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

export default function ShareModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/post/${postId}`;

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
    setSharing(true);
    const result = await sharePost(postId, '');
    setSharing(false);
    onClose();
    if (result.success) window.location.reload();
    else alert(result.error.message);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-xl rounded-t-2xl bg-white p-2 pb-6" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300" />
        <p className="px-4 py-2 font-semibold">Share</p>

        <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg border p-2">
          <input readOnly value={url} className="flex-1 truncate border-none text-sm text-slate-600 outline-none" />
          <button onClick={copyLink} className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">
            <LinkIcon /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <button onClick={handleRepost} disabled={sharing} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
          <span className="text-slate-600"><RepostIcon /></span>
          <span className="text-slate-800">Repost to your feed</span>
        </button>
        <button onClick={() => shareTo('whatsapp')} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
          <span className="text-slate-600"><WhatsAppIcon /></span>
          <span className="text-slate-800">Share to WhatsApp</span>
        </button>
        <button onClick={() => shareTo('facebook')} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
          <span className="text-slate-600"><FacebookIcon /></span>
          <span className="text-slate-800">Share to Facebook</span>
        </button>
      </div>
    </div>
  );
}
