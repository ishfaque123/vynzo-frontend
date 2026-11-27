'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { addReelComment, deleteReelComment, editReelComment, setReelCommentReaction } from '@/lib/api/reelCommentApi';
import { reportReelComment } from '@/lib/api/reelApi';
import { playCommentSound } from '@/lib/sounds';
import Avatar from '@/components/Avatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import ReactionIcon from './ReactionIcon';
import { EmojiToggleButton, CommentEmojiPanel } from './CommentEmojiPicker';
import ReportModal from './ReportModal';

const REACTIONS: Record<string, string> = { like: '👍', love: '❤️', haha: '😆', wow: '😮', sad: '😢', angry: '😠' };
const CLOSE_THRESHOLD = 100;
const COMMENT_MAX_LENGTH = 500;

// One-tap emoji comments: tapping one posts it as the comment text (this is
// not a reaction — reactions live on each comment row). Same set and order as
// the quick row in CommentsModal.
const QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

type CommentNode = { id: string; content: string; createdAt: string; reactionCount: number; myReaction: string | null; author: { id: string; username?: string | null; displayName?: string | null; profilePictureUrl?: string | null; isVerified?: boolean }; replies?: CommentNode[] };

function timeAgo(date: string) { const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000)); if (seconds < 60) return 'now'; const minutes = Math.floor(seconds / 60); if (minutes < 60) return `${minutes}m`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h`; const days = Math.floor(hours / 24); if (days < 7) return `${days}d`; const weeks = Math.floor(days / 7); if (weeks < 4) return `${weeks}w`; const months = Math.floor(days / 30); if (months < 12) return `${months}mo`; return `${Math.floor(days / 365)}y`; }
function DotsIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>; }
function renderWithMentions(text: string) { const parts = text.split(/(@[a-zA-Z0-9_.]+)/g); return parts.map((part, i) => part.startsWith('@') && part.length > 1 ? <Link key={i} href={`/u/${part.slice(1)}`} className="font-semibold text-blue-600">{part}</Link> : <span key={i}>{part}</span>); }

function CommentRow({ comment, currentUserId, reelOwner, onReply, onChanged, depth = 0 }: { comment: CommentNode; currentUserId?: string; reelOwner: boolean; onReply: (comment: CommentNode) => void; onChanged: (delta: number) => void; depth?: number }) {
  const [picker, setPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [reaction, setReaction] = useState<string | null>(comment.myReaction);
  const [count, setCount] = useState(comment.reactionCount || 0);
  const [busy, setBusy] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportNote, setReportNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStart = useRef<{ x: number; y: number } | null>(null);
  const isOwner = currentUserId === comment.author.id;
  const canDelete = isOwner || reelOwner;
  const replies = comment.replies || [];

  useEffect(() => {
    setReaction(comment.myReaction);
    setCount(comment.reactionCount || 0);
    setEditText(comment.content);
  }, [comment.myReaction, comment.reactionCount, comment.content]);

  useEffect(() => {
    const closeOther = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (id !== comment.id) {
        setMenuOpen(false);
        setPicker(false);
      }
    };
    window.addEventListener('reel-comment-popup-open', closeOther);
    return () => window.removeEventListener('reel-comment-popup-open', closeOther);
  }, [comment.id]);

  function openMenu() {
    window.dispatchEvent(new CustomEvent('reel-comment-popup-open', { detail: comment.id }));
    setPicker(false);
    setMenuOpen((v) => !v);
  }

  function cancelLongPress() { if (longPressTimer.current) clearTimeout(longPressTimer.current); longPressTimer.current = null; longPressStart.current = null; }
  function startLongPress(x: number, y: number) { cancelLongPress(); longPressStart.current = { x, y }; longPressTimer.current = setTimeout(() => { longPressTimer.current = null; longPressStart.current = null; window.dispatchEvent(new CustomEvent('reel-comment-popup-open', { detail: comment.id })); setPicker(false); setMenuOpen(true); }, 550); }
  function moveLongPress(x: number, y: number) { const s = longPressStart.current; if (s && Math.hypot(x - s.x, y - s.y) > 10) cancelLongPress(); }
  function endLongPress() { cancelLongPress(); }

  function openPicker() {
    window.dispatchEvent(new CustomEvent('reel-comment-popup-open', { detail: comment.id }));
    setMenuOpen(false);
    setPicker((v) => !v);
  }

  async function react(type: string) {
    if (busy) return;
    setPicker(false);
    const previous = reaction;
    const previousCount = count;
    const next = previous === type ? null : type;
    setReaction(next);
    setCount(Math.max(0, previousCount + (previous === type ? -1 : previous ? 0 : 1)));
    setBusy(true);
    const result = await setReelCommentReaction(comment.id, type);
    setBusy(false);
    if (!result.success) {
      setReaction(previous);
      setCount(previousCount);
    } else {
      setReaction(result.data?.reaction ?? null);
    }
  }

  async function remove() {
    if (!canDelete || deleteBusy) return;
    setConfirmDelete(false);
    setDeleteBusy(true);
    const result = await deleteReelComment(comment.id);
    setDeleteBusy(false);
    if (result.success) {
      setFeedback('success');
      // Server counts every comment row (top-level + replies) in _count.comments,
      // and deleting a top-level comment cascades to its replies, so the badge
      // must drop by 1 + reply count, not just 1 — and a reply delete by 1.
      onChanged(-(1 + (depth === 0 ? replies.length : 0)));
    } else {
      setFeedback('error');
    }
  }

  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    const text = editText.trim();
    if (!text || saving) return;
    setSaving(true);
    const result = await editReelComment(comment.id, text);
    setSaving(false);
    if (result.success) {
      setEditing(false);
      onChanged(0);
    }
  }

  function report() {
    setMenuOpen(false);
    setShowReport(true);
  }

  async function submitReport(reason: string, details?: string) {
    const result = await reportReelComment(comment.id, reason, details);
    if (result.success) {
      setShowReport(false);
      setReportNote({ ok: true, text: 'Comment reported.' });
    } else if (result.error?.message) {
      setReportNote({ ok: false, text: result.error.message });
    }
    window.setTimeout(() => setReportNote(null), 3000);
  }

  function copy() {
    navigator.clipboard?.writeText(comment.content).catch(() => {});
    setMenuOpen(false);
  }

  return (
    <>
      <div className={depth > 0 ? 'ml-9 mt-2' : 'mb-3'} onTouchStart={(e) => startLongPress(e.touches[0].clientX, e.touches[0].clientY)} onTouchMove={(e) => moveLongPress(e.touches[0].clientX, e.touches[0].clientY)} onTouchEnd={endLongPress} onTouchCancel={endLongPress} onPointerDown={(e) => startLongPress(e.clientX, e.clientY)} onPointerMove={(e) => moveLongPress(e.clientX, e.clientY)} onPointerUp={endLongPress} onPointerCancel={endLongPress}>
        <div className="flex items-start gap-2.5">
          <Link href={comment.author.username ? `/u/${comment.author.username}` : '#'} className="shrink-0"><Avatar url={comment.author.profilePictureUrl} name={comment.author.displayName} px={depth > 0 ? 28 : 36} /></Link>
          <div className="min-w-0 flex-1">
            <div className="group">
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 items-center gap-1">
                  <Link href={comment.author.username ? `/u/${comment.author.username}` : '#'} className="text-sm font-semibold text-slate-900 hover:underline">
                    {comment.author.displayName || comment.author.username || 'User'}
                  </Link>
                  {comment.author.isVerified && <VerifiedBadge size="sm" />}
                </div>
                <span className="text-[11px] text-slate-400">{timeAgo(comment.createdAt)}</span>
              </div>
              {editing ? (
                <div className="mt-1 flex gap-2">
                  <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} className="min-w-0 flex-1 rounded-lg border bg-white px-2 py-1 text-sm" />
                  <button onClick={saveEdit} disabled={saving} className="text-xs font-semibold text-blue-600 disabled:opacity-50">{saving ? '...' : 'Save'}</button>
                  <button onClick={() => { setEditing(false); setEditText(comment.content); }} className="text-xs text-slate-500">Cancel</button>
                </div>
              ) : (
                <p className="break-words text-sm leading-5 text-slate-800">{renderWithMentions(depth > 0 ? comment.content.replace(/^@[a-zA-Z0-9_.]+\s*/, '') : comment.content)}</p>
              )}
            </div>

            <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
              <div className="relative">
                <button onClick={openPicker} className={`flex items-center gap-1 ${reaction ? 'font-semibold text-blue-600' : ''}`}>
                  {reaction ? <ReactionIcon type={reaction} size={18} /> : 'Like'}
                </button>
                {picker && (
                  <div className="absolute bottom-full left-0 z-30 mb-2 flex gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-xl">
                    {Object.keys(REACTIONS).map((key) => (
                      <button key={key} onClick={() => react(key)} aria-label={key} className="transition-transform hover:scale-125"><ReactionIcon type={key} size={32} /></button>
                    ))}
                  </div>
                )}
              </div>
              {count > 0 && (
                <span className="flex items-center gap-1">
                  <ReactionIcon type={reaction ?? 'like'} size={14} />
                  {count}
                </span>
              )}
              <button onClick={() => onReply(comment)}>Reply</button>
              <div className="relative ml-auto">
                <button aria-label="Comment options" onClick={openMenu} className="rounded-full p-1 hover:bg-slate-200">
                  <DotsIcon />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-xl border bg-white py-1 text-sm shadow-xl">
                    <button onClick={() => onReply(comment)} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Reply</button>
                    <button onClick={copy} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Copy</button>
                    {isOwner && <button onClick={() => { setMenuOpen(false); setEditing(true); setEditText(comment.content); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Edit</button>}
                    {canDelete && <button onClick={() => { setMenuOpen(false); setConfirmDelete(true); }} className="block w-full px-3 py-2 text-left text-red-600 hover:bg-slate-50">Delete</button>}
                    {!isOwner && !reelOwner && <button onClick={report} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Report</button>}
                  </div>
                )}
              </div>
            </div>

            {depth === 0 && replies.length > 0 && (
              <button onClick={() => setShowReplies((v) => !v)} className="mt-2 text-xs font-semibold text-slate-600 hover:text-slate-900">
                {showReplies ? 'Hide replies' : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
          </div>
        </div>

        {showReplies && depth === 0 && (
          <div className="ml-5 mt-1 border-l-2 border-slate-200/60 pl-3">
            {replies.map((reply) => (
              <CommentRow key={reply.id} comment={reply} currentUserId={currentUserId} reelOwner={reelOwner} onReply={onReply} onChanged={onChanged} depth={1} />
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-5" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} onTouchCancel={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onPointerCancel={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-900">Delete comment?</div>
            <p className="mt-1.5 text-sm leading-5 text-slate-500">This comment will be permanently removed.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={remove} disabled={deleteBusy} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{deleteBusy ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className="fixed inset-x-0 top-5 z-[110] flex justify-center px-4 pointer-events-none">
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ${feedback === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {feedback === 'success' ? 'Comment deleted successfully.' : 'Failed to delete comment. Please try again.'}
          </div>
        </div>
      )}

      {showReport && <ReportModal title="Report comment" onClose={() => setShowReport(false)} onSubmit={submitReport} />}

      {reportNote && (
        <div className="fixed inset-x-0 top-5 z-[110] flex justify-center px-4 pointer-events-none">
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ${reportNote.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {reportNote.text}
          </div>
        </div>
      )}
    </>
  );
}

function CommentSkeleton({ count = 4 }: { count?: number }) {
  return <div className="space-y-5" aria-label="Loading comments">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex gap-3 animate-pulse">
        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-3 w-4/5 rounded bg-slate-200" />
          <div className="h-3 w-2/5 rounded bg-slate-200" />
        </div>
      </div>
    ))}
  </div>;
}

export default function ReelCommentsModal({ reelId, reelOwner, currentUserId, currentUserAvatar, currentUserName, comments, loading, hasMore, loadingMore, onLoadMore, onClose, onCountChange, totalCount }: { reelId: string; reelOwner: boolean; currentUserId?: string; currentUserAvatar?: string | null; currentUserName?: string | null; comments: CommentNode[]; loading: boolean; hasMore: boolean; loadingMore: boolean; onLoadMore: () => void; onClose: () => void; onCountChange: (delta: number) => void; totalCount?: number }) {
  const [items, setItems] = useState<CommentNode[]>(comments || []); const [text, setText] = useState(''); const [replyTo, setReplyTo] = useState<CommentNode | null>(null); const [dragY, setDragY] = useState(0); const [dragging, setDragging] = useState(false); const [pullClosing, setPullClosing] = useState(false); const startY = useRef(0); const commentsRef = useRef<HTMLDivElement>(null); const pullStartY = useRef(0); const pullStartX = useRef(0); const inputRef = useRef<HTMLInputElement>(null); const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => setItems(comments || []), [comments]);
  useEffect(() => { const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; }; }, []);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { function updateViewport() { const vv = window.visualViewport; if (vv) setViewport({ top: vv.offsetTop, height: vv.height }); } updateViewport(); window.visualViewport?.addEventListener('resize', updateViewport); window.visualViewport?.addEventListener('scroll', updateViewport); return () => { window.visualViewport?.removeEventListener('resize', updateViewport); window.visualViewport?.removeEventListener('scroll', updateViewport); }; }, []);
  useEffect(() => { const t = window.setTimeout(() => inputRef.current?.focus(), 300); return () => window.clearTimeout(t); }, []);
  const [sending, setSending] = useState(false);
  const justSentRef = useRef(false);
  useEffect(() => { if (!justSentRef.current) return; justSentRef.current = false; const el = commentsRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, [items]);

  function beginDrag(y: number) { startY.current = y; setDragging(true); }
  function moveDrag(y: number) { if (!dragging) return; const delta = y - startY.current; if (delta > 0) setDragY(delta); }
  function endDrag() { if (!dragging) return; setDragging(false); if (dragY > CLOSE_THRESHOLD) onClose(); setDragY(0); }
  function beginPullClose(e: React.TouchEvent<HTMLDivElement>) {
    const el = commentsRef.current;
    if (!el || el.scrollTop > 0) return;
    pullStartY.current = e.touches[0].clientY;
    pullStartX.current = e.touches[0].clientX;
    setPullClosing(false);
    setDragY(0);
  }
  function movePullClose(e: React.TouchEvent<HTMLDivElement>) {
    const el = commentsRef.current;
    if (!el || pullStartY.current === 0) return;
    const touch = e.touches[0];
    const dy = touch.clientY - pullStartY.current;
    const dx = Math.abs(touch.clientX - pullStartX.current);

    // Upward swipe must remain a normal comments scroll. Only a downward
    // swipe starting at the very top is treated as the close gesture.
    if (dy < 0 || dx >= Math.abs(dy) || el.scrollTop > 0) {
      pullStartY.current = 0;
      pullStartX.current = 0;
      setPullClosing(false);
      setDragY(0);
      return;
    }

    e.preventDefault();
    setPullClosing(true);
    setDragY(dy);
  }
  function endPullClose() {
    if (pullStartY.current === 0) return;
    pullStartY.current = 0;
    pullStartX.current = 0;
    setPullClosing(false);
    setDragging(false);
    setDragY((current) => {
      if (current > CLOSE_THRESHOLD) {
        onClose();
        return 0;
      }
      return 0;
    });
  }
  function startReply(comment: CommentNode) { setReplyTo(comment); setText(''); window.setTimeout(() => { inputRef.current?.focus(); inputRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' }); }, 0); }
  function insertEmoji(emoji: string) { const el = inputRef.current; const start = el?.selectionStart ?? text.length; const end = el?.selectionEnd ?? text.length; const next = (text.slice(0, start) + emoji + text.slice(end)).slice(0, COMMENT_MAX_LENGTH); setText(next); requestAnimationFrame(() => { const pos = Math.min(start + emoji.length, next.length); el?.setSelectionRange?.(pos, pos); }); }
  const [emojiOpen, setEmojiOpen] = useState(false);
  function toggleEmojiPanel() { setEmojiOpen((v) => { if (!v) inputRef.current?.blur(); return !v; }); }
  async function postComment(content: string, clearDraft: boolean) {
    if (!content || sending) return;
    setSending(true);
    const parentId = replyTo?.id;
    const result = await addReelComment(reelId, content, parentId);
    setSending(false);
    if (!result.success) return;
    playCommentSound();
    if (clearDraft) setText('');
    setReplyTo(null);
    onCountChange(1);
    const added = { ...result.data.comment, author: result.data.comment.user, reactionCount: 0, myReaction: null, replies: [] } as CommentNode;
    justSentRef.current = true;
    setItems((prev) => {
      if (!parentId) return [...prev, added];
      const insert = (list: CommentNode[]): CommentNode[] => list.map((c) => c.id === parentId ? { ...c, replies: [...(c.replies || []), added] } : { ...c, replies: insert(c.replies || []) });
      return insert(prev);
    });
  }
  async function send() { await postComment(text.trim(), true); }
  // Post one emoji as a comment with a single tap. Calls the API directly
  // with the emoji as the content — never via setText + send(), because that
  // state update is async and would post stale/empty text. The typed draft
  // is left untouched: only the reply context is consumed.
  async function sendQuickEmoji(emoji: string) { await postComment(emoji, false); }
  function changed(delta: number) { if (delta !== 0) onCountChange(delta); window.dispatchEvent(new CustomEvent('reel-comments-refresh', { detail: reelId })); }
  if (!mounted) return null;
  // N2 fix: the header must show the reel's TRUE total comment count
  // (server _count, roots + replies), not items.length — which is only
  // the roots loaded on the current page (page size 20). The parent keeps
  // totalCount in sync via onCountChange on send/delete, so no separate
  // local counter is needed (that would double-count). Fallback counts
  // roots + nested replies when no server total is supplied.
  const countAll = (list: CommentNode[]): number => list.reduce((n, c) => n + 1 + countAll(c.replies || []), 0);
  const headerCount = typeof totalCount === 'number' ? totalCount : countAll(items);
  const wrapperStyle: React.CSSProperties = viewport ? { position: 'fixed', top: viewport.top, left: 0, right: 0, height: viewport.height } : { position: 'fixed', inset: 0 };
  const modalHeight = viewport ? Math.round(viewport.height * 0.78) : undefined;
  return createPortal(
    <div className="z-50 flex items-end justify-center bg-black/50" style={wrapperStyle} onClick={onClose}>
      <div className="flex w-full max-w-xl min-h-0 flex-col rounded-t-2xl bg-white" style={{ height: modalHeight ? `${modalHeight}px` : '78vh', maxHeight: '100%', transform: `translateY(${dragY}px)`, transition: dragging || pullClosing ? 'none' : 'transform 0.2s ease' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center py-2" style={{ touchAction: 'none' }} onTouchStart={(e) => beginDrag(e.touches[0].clientY)} onTouchMove={(e) => moveDrag(e.touches[0].clientY)} onTouchEnd={endDrag}><span className="h-1 w-10 rounded-full bg-slate-300" /></div>
        <div className="relative border-b border-slate-200 px-4 py-3 text-center"><div className="text-sm font-semibold text-slate-900">Comments</div><div className="mt-0.5 text-[11px] text-slate-400">{headerCount ? `${headerCount} ${headerCount === 1 ? 'comment' : 'comments'}` : 'Join the conversation'}</div><button onClick={onClose} aria-label="Close comments" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
        <div ref={commentsRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3" onScroll={(e) => { if (loading || loadingMore || !hasMore) return; const el = e.currentTarget; if (el.scrollHeight - el.scrollTop - el.clientHeight < 180) void onLoadMore(); }} style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehaviorY: 'contain' }} onTouchStart={(e) => { e.stopPropagation(); beginPullClose(e); }} onTouchMove={(e) => { e.stopPropagation(); movePullClose(e); }} onTouchEnd={(e) => { e.stopPropagation(); endPullClose(); }} onTouchCancel={(e) => { e.stopPropagation(); pullStartY.current = 0; pullStartX.current = 0; setPullClosing(false); setDragY(0); }} onPointerDown={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
          {loading ? <CommentSkeleton /> : items.length === 0 ? <div className="flex min-h-full flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2 1.5-4.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></svg></div><p className="text-sm font-semibold text-slate-800">No comments yet</p><p className="mt-1 text-xs text-slate-400">Be the first to start the conversation.</p></div> : <>{items.map((comment) => <CommentRow key={comment.id} comment={comment} currentUserId={currentUserId} reelOwner={reelOwner} onReply={startReply} onChanged={changed} />)}{loadingMore && <div className="pt-3"><CommentSkeleton count={2} /></div>}</>}
        </div>
        <div className="border-t border-slate-200 bg-white px-3 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>{replyTo && <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500"><span>Replying to <span className="font-semibold text-slate-700">@{replyTo.author.username || replyTo.author.displayName || 'user'}</span></span><button type="button" onClick={() => { setReplyTo(null); setText(''); }} className="font-semibold text-slate-500 hover:text-slate-900">Cancel</button></div>}<div className="mb-2 flex w-full items-center justify-between" role="group" aria-label="Quick emoji comments">{QUICK_EMOJIS.map((emoji) => (<button key={emoji} type="button" onClick={() => sendQuickEmoji(emoji)} disabled={sending} aria-label={`Comment ${emoji}`} className="text-2xl leading-none transition-transform hover:scale-125 disabled:opacity-40">{emoji}</button>))}</div><div className="flex items-end gap-2"><Avatar url={currentUserAvatar} name={currentUserName} px={32} /><div className="relative flex-1"><input ref={inputRef} value={text} maxLength={COMMENT_MAX_LENGTH} onChange={(e) => setText(e.target.value)} onFocus={(e) => { setEmojiOpen(false); window.setTimeout(() => e.currentTarget.scrollIntoView({ block: 'center', inline: 'nearest' }), 0); }} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'} className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-12 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-100" /><div className="absolute bottom-0.5 right-1"><EmojiToggleButton open={emojiOpen} onToggle={toggleEmojiPanel} /></div>{text.length > COMMENT_MAX_LENGTH - 60 && <p className="mt-1 px-2 text-right text-[11px] text-slate-400">{text.length}/{COMMENT_MAX_LENGTH}</p>}</div><button onClick={send} disabled={sending || !text.trim()} aria-label="Send comment" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white transition disabled:cursor-not-allowed disabled:opacity-40">{sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4l17.8-7.5c.8-.35.8-1.45 0-1.8L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .72.73 1.2 1.39.91z" /></svg>}</button></div>{emojiOpen && <CommentEmojiPanel onInsert={insertEmoji} onKeyboard={() => { setEmojiOpen(false); inputRef.current?.focus(); }} />}</div>
      </div>
    </div>,
    document.body
  );
}
