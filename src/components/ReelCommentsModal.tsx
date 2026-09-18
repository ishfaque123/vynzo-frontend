'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { addReelComment, deleteReelComment, setReelCommentReaction } from '@/lib/api/reelCommentApi';
import { reportReelComment } from '@/lib/api/reelApi';
import { playCommentSound } from '@/lib/sounds';

const REACTIONS: Record<string, string> = { like: '👍', love: '❤️', haha: '😆', wow: '😮', sad: '😢', angry: '😠' };
const CLOSE_THRESHOLD = 100;
const COMMENT_MAX_LENGTH = 500;

type CommentNode = { id: string; content: string; createdAt: string; reactionCount: number; myReaction: string | null; author: { id: string; username?: string | null; displayName?: string | null; profilePictureUrl?: string | null }; replies?: CommentNode[] };

function timeAgo(date: string) { const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000)); if (seconds < 60) return 'now'; const minutes = Math.floor(seconds / 60); if (minutes < 60) return `${minutes}m`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h`; const days = Math.floor(hours / 24); if (days < 7) return `${days}d`; const weeks = Math.floor(days / 7); if (weeks < 4) return `${weeks}w`; const months = Math.floor(days / 30); if (months < 12) return `${months}mo`; return `${Math.floor(days / 365)}y`; }
function Avatar({ author }: { author: CommentNode['author'] }) { return <Link href={author.username ? `/u/${author.username}` : '#'} className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-200 bg-cover bg-center text-center text-xs font-semibold leading-8 text-slate-600" style={author.profilePictureUrl ? { backgroundImage: `url(${author.profilePictureUrl})` } : {}}>{!author.profilePictureUrl && (author.displayName?.[0]?.toUpperCase() || '?')}</Link>; }
function DotsIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>; }
function renderWithMentions(text: string) { const parts = text.split(/(@[a-zA-Z0-9_.]+)/g); return parts.map((part, i) => part.startsWith('@') && part.length > 1 ? <Link key={i} href={`/u/${part.slice(1)}`} className="font-semibold text-blue-600">{part}</Link> : <span key={i}>{part}</span>); }

function CommentRow({ comment, currentUserId, reelOwner, onReply, onChanged, depth = 0 }: { comment: CommentNode; currentUserId?: string; reelOwner: boolean; onReply: (comment: CommentNode) => void; onChanged: (topLevel: boolean) => void; depth?: number }) {
  const [picker, setPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [reaction, setReaction] = useState<string | null>(comment.myReaction);
  const [count, setCount] = useState(comment.reactionCount || 0);
  const [busy, setBusy] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
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
      onChanged(depth === 0);
    } else {
      setFeedback('error');
    }
  }

  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    const text = editText.trim();
    if (!text || saving) return;
    setSaving(true);
    const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reels/comments/${encodeURIComponent(comment.id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    }).then((r) => r.json()).catch(() => ({ success: false }));
    setSaving(false);
    if (result.success) {
      setEditing(false);
      onChanged(false);
    }
  }

  async function report() {
    setMenuOpen(false);
    const ok = window.confirm('Report this comment?');
    if (!ok) return;
    const result = await reportReelComment(comment.id);
    if (result.success) window.alert('Comment reported.');
    else if (result.error?.message) window.alert(result.error.message);
  }

  function copy() {
    navigator.clipboard?.writeText(comment.content).catch(() => {});
    setMenuOpen(false);
  }

  return (
    <>
      <div className={depth > 0 ? 'ml-9 mt-2' : 'mb-3'}>
        <div className="flex items-start gap-2">
          <Avatar author={comment.author} />
          <div className="min-w-0 flex-1">
            {depth > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <Link href={comment.author.username ? `/u/${comment.author.username}` : '#'} className="shrink-0 text-sm font-semibold text-slate-900 hover:underline">
                    @{comment.author.username || comment.author.displayName || 'user'}
                  </Link>
                  <p className="min-w-0 break-words text-sm leading-5 text-slate-800">
                    {renderWithMentions(comment.content.replace(/^@[a-zA-Z0-9_.]+\s*/, ''))}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="group">
                  <div className="flex items-center gap-2">
                    <Link href={comment.author.username ? `/u/${comment.author.username}` : '#'} className="text-sm font-semibold text-slate-900 hover:underline">
                      {comment.author.displayName || comment.author.username || 'User'}
                    </Link>
                    <span className="text-[11px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                  </div>
                  {editing ? (
                    <div className="mt-1 flex gap-2">
                      <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} className="min-w-0 flex-1 rounded-lg border bg-white px-2 py-1 text-sm" />
                      <button onClick={saveEdit} disabled={saving} className="text-xs font-semibold text-blue-600 disabled:opacity-50">{saving ? '...' : 'Save'}</button>
                      <button onClick={() => { setEditing(false); setEditText(comment.content); }} className="text-xs text-slate-500">Cancel</button>
                    </div>
                  ) : (
                    <p className="break-words text-sm leading-5 text-slate-800">{renderWithMentions(comment.content)}</p>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-4 px-1 text-[11px] text-slate-500">
                  <div className="relative">
                    <button onClick={openPicker} className={reaction ? 'font-semibold text-blue-600' : ''}>
                      {reaction ? REACTIONS[reaction] : 'Like'}
                    </button>
                    {picker && (
                      <div className="absolute bottom-full left-0 z-30 mb-2 flex gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-xl">
                        {Object.entries(REACTIONS).map(([key, emoji]) => (
                          <button key={key} onClick={() => react(key)} className="text-lg transition-transform hover:scale-125">{emoji}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {count > 0 && <span>{count}</span>}
                  <button onClick={() => onReply(comment)}>Reply</button>
                  <span>{timeAgo(comment.createdAt)}</span>
                  <div className="relative ml-auto">
                    <button aria-label="Comment options" onClick={openMenu} className="rounded-full p-1 hover:bg-slate-200">
                      <DotsIcon />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-xl border bg-white py-1 text-sm shadow-xl">
                        {isOwner && <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Edit</button>}
                        {canDelete && <button onClick={() => { setMenuOpen(false); setConfirmDelete(true); }} className="block w-full px-3 py-2 text-left text-red-600 hover:bg-slate-50">Delete</button>}
                        <button onClick={copy} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Copy</button>
                        {!isOwner && <button onClick={report} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Report</button>}
                      </div>
                    )}
                  </div>
                </div>

                {depth === 0 && replies.length > 0 && (
                  <button onClick={() => setShowReplies((v) => !v)} className="mt-2 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900">
                    {showReplies ? 'Hide replies' : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {showReplies && depth === 0 && replies.map((reply) => (
          <CommentRow key={reply.id} comment={reply} currentUserId={currentUserId} reelOwner={reelOwner} onReply={onReply} onChanged={onChanged} depth={1} />
        ))}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-5" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
    </>
  );
}

export default function ReelCommentsModal({ reelId, reelOwner, currentUserId, comments, onClose, onCountChange }: { reelId: string; reelOwner: boolean; currentUserId?: string; comments: CommentNode[]; onClose: () => void; onCountChange: (delta: number) => void }) {
  const [items, setItems] = useState<CommentNode[]>(comments || []); const [text, setText] = useState(''); const [replyTo, setReplyTo] = useState<CommentNode | null>(null); const [dragY, setDragY] = useState(0); const [dragging, setDragging] = useState(false); const startY = useRef(0); const commentsRef = useRef<HTMLDivElement>(null); const inputRef = useRef<HTMLInputElement>(null); const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null);
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
  function listTouchStart(e: React.TouchEvent) { startY.current = e.touches[0].clientY; setDragging(false); }
  function listTouchMove(e: React.TouchEvent) { const currentY = e.touches[0].clientY; const delta = currentY - startY.current; const el = commentsRef.current; if (!dragging) { if (delta > 0 && el && el.scrollTop <= 0) setDragging(true); else return; } e.preventDefault(); setDragY(Math.max(0, delta)); }
  function listTouchEnd() { if (!dragging) return; setDragging(false); setDragY((current) => { if (current > CLOSE_THRESHOLD) onClose(); return 0; }); }
  function startReply(comment: CommentNode) { setReplyTo(comment); setText(`@${comment.author.username || comment.author.displayName || 'user'} `); window.setTimeout(() => { inputRef.current?.focus(); inputRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' }); }, 0); }
  async function send() { const content = text.trim(); if (!content || sending) return; setSending(true); const result = await addReelComment(reelId, content, replyTo?.id); setSending(false); if (!result.success) return; playCommentSound(); setText(''); setReplyTo(null); onCountChange(replyTo ? 0 : 1); const added = { ...result.data.comment, author: result.data.comment.user, reactionCount: 0, myReaction: null, replies: [] } as CommentNode; justSentRef.current = true; setItems((prev) => { if (!replyTo) return [...prev, added]; const insert = (list: CommentNode[]): CommentNode[] => list.map((c) => c.id === replyTo.id ? { ...c, replies: [...(c.replies || []), added] } : { ...c, replies: insert(c.replies || []) }); return insert(prev); }); }
  function changed(topLevel: boolean) { if (topLevel) onCountChange(-1); window.dispatchEvent(new CustomEvent('reel-comments-refresh', { detail: reelId })); }
  if (!mounted) return null;
  const wrapperStyle: React.CSSProperties = viewport ? { position: 'fixed', top: viewport.top, left: 0, right: 0, height: viewport.height } : { position: 'fixed', inset: 0 };
  const modalHeight = viewport ? Math.round(viewport.height * 0.9) : undefined;
  return createPortal(
    <div className="z-50 flex items-end justify-center bg-black/50" style={wrapperStyle} onClick={onClose}>
      <div className="flex w-full max-w-xl min-h-0 flex-col rounded-t-2xl bg-white" style={{ height: modalHeight ? `${modalHeight}px` : '88vh', maxHeight: '100%', transform: `translateY(${dragY}px)`, transition: dragging ? 'none' : 'transform 0.2s ease' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center py-2" style={{ touchAction: 'none' }} onTouchStart={(e) => beginDrag(e.touches[0].clientY)} onTouchMove={(e) => moveDrag(e.touches[0].clientY)} onTouchEnd={endDrag}><span className="h-1 w-10 rounded-full bg-slate-300" /></div>
        <div className="border-b border-slate-200 px-4 py-3 text-center"><div className="text-sm font-semibold text-slate-900">Comments</div><div className="mt-0.5 text-[11px] text-slate-400">{items.length ? `${items.length} ${items.length === 1 ? 'comment' : 'comments'}` : 'Join the conversation'}</div></div>
        <div ref={commentsRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehaviorY: 'contain' }}>{items.length === 0 ? <div className="flex min-h-full flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2 1.5-4.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></svg></div><p className="text-sm font-semibold text-slate-800">No comments yet</p><p className="mt-1 text-xs text-slate-400">Be the first to start the conversation.</p></div> : items.map((comment) => <CommentRow key={comment.id} comment={comment} currentUserId={currentUserId} reelOwner={reelOwner} onReply={startReply} onChanged={changed} />)}</div>
        <div className="border-t border-slate-200 bg-white px-3 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>{replyTo && <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500"><span>Replying to <span className="font-semibold text-slate-700">@{replyTo.author.username || replyTo.author.displayName || 'user'}</span></span><button type="button" onClick={() => { setReplyTo(null); setText(''); }} className="font-semibold text-slate-500 hover:text-slate-900">Cancel</button></div>}<div className="flex items-end gap-2"><div className="flex-1"><input ref={inputRef} value={text} maxLength={COMMENT_MAX_LENGTH} onChange={(e) => setText(e.target.value)} onFocus={(e) => window.setTimeout(() => e.currentTarget.scrollIntoView({ block: 'center', inline: 'nearest' }), 0)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'} className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-100" />{text.length > COMMENT_MAX_LENGTH - 60 && <p className="mt-1 px-2 text-right text-[11px] text-slate-400">{text.length}/{COMMENT_MAX_LENGTH}</p>}</div><button onClick={send} disabled={sending || !text.trim()} className="h-10 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">{sending ? '...' : 'Send'}</button></div></div>
      </div>
    </div>,
    document.body
  );
}
