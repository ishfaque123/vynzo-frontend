'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { setCommentReaction, deleteComment, editComment, reportComment } from '@/lib/api/commentApi';
import FollowButton from './FollowButton';
import Toast from './Toast';
import VerifiedBadge from './VerifiedBadge';
import ReactionIcon from './ReactionIcon';
import Avatar from './Avatar';

const REACTION_KEYS = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
const REACTION_LABELS: Record<string, string> = { like: 'Like', love: 'Love', haha: 'Haha', wow: 'Wow', sad: 'Sad', angry: 'Angry' };

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  );
}
function formatCount(n: number) {
  if (n < 10000) return n.toLocaleString('en-US');
  if (n < 1000000) { const k = Math.round(n / 100) / 10; return k >= 1000 ? '1M' : `${k % 1 === 0 ? k : k.toFixed(1)}k`; }
  if (n < 1000000000) { const m = Math.round(n / 100000) / 10; return m >= 1000 ? '1B' : `${m % 1 === 0 ? m : m.toFixed(1)}M`; }
  const b = Math.round(n / 100000000) / 10; return `${b % 1 === 0 ? b : b.toFixed(1)}B`;
}
function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}

export default function CommentItem({ comment, currentUser, postOwnerId, onReplyClick, onChanged, depth = 0, parentAuthor }: any) {
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    function onOtherOpen(e: any) {
      if (e.detail !== comment.id) setShowPicker(false);
    }
    window.addEventListener('reaction-picker-open', onOtherOpen);
    return () => window.removeEventListener('reaction-picker-open', onOtherOpen);
  }, [comment.id]);

  function openPicker() {
    window.dispatchEvent(new CustomEvent('reaction-picker-open', { detail: comment.id }));
    setShowPicker(true);
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [localReaction, setLocalReaction] = useState<string | null>(comment.myReaction ?? null);
  const [localCount, setLocalCount] = useState<number>(comment.reactionCount || 0);
  const [reporting, setReporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const reactSeqRef = useRef(0);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isOwner = currentUser?.id === comment.author.id;
  const canDelete = isOwner || currentUser?.id === postOwnerId;
  const isReply = depth > 0;

  useEffect(() => {
    setLocalReaction(comment.myReaction ?? null);
    setLocalCount(comment.reactionCount || 0);
  }, [comment.myReaction, comment.reactionCount]);

  // Guarded against out-of-order responses: if the user taps a second
  // reaction before the first request resolves, only the most recently
  // issued request is allowed to update state.
  async function react(type: string) {
    setShowPicker(false);
    const prevReaction = localReaction;
    const prevCount = localCount;
    const removing = prevReaction === type;

    setLocalReaction(removing ? null : type);
    setLocalCount(prevCount + (removing ? -1 : prevReaction ? 0 : 1));

    const seq = ++reactSeqRef.current;
    const result = await setCommentReaction(comment.id, type);
    if (seq !== reactSeqRef.current) return;
    if (!result.success) {
      setLocalReaction(prevReaction);
      setLocalCount(prevCount);
    }
  }
  async function handleDelete() {
    setConfirmDelete(false);
    setDeleting(true);
    try {
      const result = await deleteComment(comment.id);
      if (result.success) onChanged('delete');
      else setToast({ message: 'Could not delete comment.', type: 'error' });
    } catch {
      setToast({ message: 'Could not delete comment.', type: 'error' });
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  }
  async function saveEdit() {
    const result = await editComment(comment.id, editText);
    if (result.success) { onChanged('edit'); setEditing(false); }
  }
  function copyComment() {
    navigator.clipboard.writeText(comment.content);
    setMenuOpen(false);
  }
  async function handleReport() {
    if (reporting) return;
    setMenuOpen(false);
    setReporting(true);
    try {
      const result = await reportComment(comment.id);
      if (result.success) {
        setToast({ message: 'Comment reported. Thanks for letting us know.', type: 'success' });
      } else {
        setToast({ message: result.error?.message || 'Could not report this comment.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Could not report this comment. Please try again.', type: 'error' });
    } finally {
      setReporting(false);
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    // Only horizontal right swipe, not vertical scroll
    if (dx > 0 && dx < 100 && dy < 30) setSwipeX(dx);
  }
  function onTouchEnd() {
    if (swipeX > 60) onReplyClick(comment.id, comment.author.username);
    setSwipeX(0);
  }

  return (
    <div
      className={isReply ? 'relative mt-2' : 'mb-4'}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={swipeX > 0 ? { transform: `translateX(${swipeX * 0.5}px)`, transition: 'none' } : { transition: 'transform 0.2s ease' }}
    >
      <style>{`
        @keyframes fz-reaction-pop {
          0% { transform: scale(0) translateY(10px); opacity: 0; }
          60% { transform: scale(1.25) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .fz-reaction-item {
          animation: fz-reaction-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25));
          transition: transform 0.15s ease;
        }
        .fz-reaction-item:hover {
          transform: scale(1.45) translateY(-6px) !important;
          z-index: 10;
        }
      `}</style>
      <div className="flex items-start gap-2.5">
        <Link href={`/u/${comment.author.username}`} className="shrink-0"><Avatar url={comment.author.profilePictureUrl} name={comment.author.displayName} px={isReply ? 28 : 36} /></Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={`/u/${comment.author.username}`} className="text-sm font-semibold">{comment.author.displayName}</Link>
            {comment.author.isVerified && <VerifiedBadge />}
            <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
            {comment.updatedAt && new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 60000 && (
              <span className="text-xs italic text-slate-400">· edited</span>
            )}
            {!isOwner && <FollowButton userId={comment.author.id} status={comment.friendStatus} compact />}
          </div>
          {editing ? (
            <div className="mt-1 flex gap-1">
              <input value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 rounded border px-2 py-1 text-sm" />
              <button onClick={saveEdit} className="text-xs font-semibold text-blue-600">Save</button>
              <button onClick={() => { setEditText(comment.content); setEditing(false); }} className="text-xs font-semibold text-slate-500">Cancel</button>
            </div>
          ) : (
            <p className="text-sm leading-snug">
              {isReply && parentAuthor && !comment.content.trim().toLowerCase().startsWith(`@${parentAuthor.username.toLowerCase()}`) && (
                <Link href={`/u/${parentAuthor.username}`} className="mr-1 font-semibold text-blue-600">@{parentAuthor.username}</Link>
              )}
              {comment.content}
            </p>
          )}
          {comment.mediaUrl && (
            <div className="mt-2">
              <img src={comment.mediaUrl} alt="Comment image" className="max-h-48 max-w-[220px] rounded-lg border bg-slate-200 object-cover cursor-pointer hover:opacity-95" onClick={() => window.open(comment.mediaUrl, '_blank')} />
            </div>
          )}

          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <div className="relative">
              <button onClick={() => (showPicker ? setShowPicker(false) : openPicker())} className={`flex items-center gap-1 ${localReaction ? 'font-semibold text-blue-600' : ''}`}>
                {localReaction ? <ReactionIcon type={localReaction} size={18} /> : 'Like'}
              </button>
              {showPicker && (
                <div className="absolute bottom-full left-0 z-50 mb-1 flex gap-1 rounded-full border border-black/5 bg-white p-1.5 shadow-xl" onMouseLeave={() => setShowPicker(false)}>
                  {REACTION_KEYS.map((key, idx) => (
                    <button key={key} onClick={() => react(key)} aria-label={REACTION_LABELS[key]}
                      className="fz-reaction-item" style={{ animationDelay: `${idx * 45}ms` }}>
                      <ReactionIcon type={key} size={32} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onReplyClick(comment.id, comment.author.username)}>Reply</button>
            {localCount > 0 && (
              <span className="flex items-center gap-1">
                <ReactionIcon type={localReaction ?? 'like'} size={14} />
                {formatCount(localCount)}
              </span>
            )}

            <div className="relative ml-auto">
              <button onClick={() => setMenuOpen(!menuOpen)}><DotsIcon /></button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border bg-white py-1 text-sm shadow-lg" onMouseLeave={() => setMenuOpen(false)}>
                  {isOwner && <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">Edit</button>}
                  {canDelete && <button onClick={() => { setConfirmDelete(true); setMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-slate-50">Delete</button>}
                  <button onClick={copyComment} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">Copy</button>
                  <button disabled={reporting} onClick={handleReport} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50 disabled:opacity-50">Report</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900">Delete comment?</h3>
            <p className="mt-1 text-sm text-slate-500">This can't be undone.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 active:scale-95">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white active:scale-95 disabled:opacity-60">{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
