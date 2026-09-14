'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { addReelComment, deleteReelComment, setReelCommentReaction } from '@/lib/api/reelCommentApi';

const REACTIONS: Record<string, string> = { like: '👍', love: '❤️', haha: '😆', wow: '😮', sad: '😢', angry: '😠' };
const CLOSE_THRESHOLD = 100;

type CommentNode = {
  id: string;
  content: string;
  createdAt: string;
  reactionCount: number;
  myReaction: string | null;
  author: { id: string; username?: string | null; displayName?: string | null; profilePictureUrl?: string | null };
  replies?: CommentNode[];
};

function timeAgo(date: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}

function Avatar({ author }: { author: CommentNode['author'] }) {
  return <Link href={author.username ? `/u/${author.username}` : '#'} className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-200 bg-cover bg-center text-center text-xs font-semibold leading-8 text-slate-600" style={author.profilePictureUrl ? { backgroundImage: `url(${author.profilePictureUrl})` } : {}}>{!author.profilePictureUrl && (author.displayName?.[0]?.toUpperCase() || '?')}</Link>;
}
function DotsIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>; }

function CommentRow({ comment, currentUserId, reelOwner, onReply, onChanged, depth = 0 }: { comment: CommentNode; currentUserId?: string; reelOwner: boolean; onReply: (comment: CommentNode) => void; onChanged: (topLevel: boolean) => void; depth?: number }) {
  const [picker, setPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [reaction, setReaction] = useState<string | null>(comment.myReaction);
  const [count, setCount] = useState(comment.reactionCount || 0);
  const [busy, setBusy] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
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
      if (id !== comment.id) { setMenuOpen(false); setPicker(false); }
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
    if (!result.success) { setReaction(previous); setCount(previousCount); }
    else setReaction(result.data?.reaction ?? null);
  }
  async function remove() {
    setMenuOpen(false);
    if (!canDelete || !confirm('Delete this comment?')) return;
    const result = await deleteReelComment(comment.id);
    if (result.success) onChanged(depth === 0);
  }
  async function saveEdit() {
    const text = editText.trim();
    if (!text) return;
    const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reels/comments/${encodeURIComponent(comment.id)}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) }).then((r) => r.json()).catch(() => ({ success: false }));
    if (result.success) { setEditing(false); onChanged(false); }
  }
  async function report() {
    setMenuOpen(false);
    const ok = window.confirm('Report this comment?');
    if (!ok) return;
    window.dispatchEvent(new CustomEvent('reel-comment-report', { detail: comment.id }));
  }
  function copy() {
    navigator.clipboard?.writeText(comment.content).catch(() => {});
    setMenuOpen(false);
  }

  return <div className={depth > 0 ? 'ml-9 mt-2' : 'mb-3'}>
    <div className="flex items-start gap-2">
      <Avatar author={comment.author} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-slate-100 px-3 py-2">
          <div className="flex items-center gap-2"><Link href={comment.author.username ? `/u/${comment.author.username}` : '#'} className="text-sm font-semibold">{comment.author.displayName || comment.author.username || 'User'}</Link></div>
          {editing ? <div className="mt-1 flex gap-2"><input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} className="min-w-0 flex-1 rounded-lg border bg-white px-2 py-1 text-sm" /><button onClick={saveEdit} className="text-xs font-semibold text-blue-600">Save</button><button onClick={() => { setEditing(false); setEditText(comment.content); }} className="text-xs text-slate-500">Cancel</button></div> : <p className="break-words text-sm">{comment.content}</p>}
        </div>
        <div className="mt-1 flex items-center gap-3 px-2 text-xs text-slate-500">
          <div className="relative">
            <button onClick={openPicker} className={reaction ? 'font-semibold text-blue-600' : ''}>{reaction ? REACTIONS[reaction] : 'Like'}</button>
            {picker && <div className="absolute bottom-full left-0 z-30 mb-1 flex gap-1 rounded-full border bg-white p-1 shadow-lg">{Object.entries(REACTIONS).map(([key, emoji]) => <button key={key} onClick={() => react(key)} className="text-lg transition-transform hover:scale-125">{emoji}</button>)}</div>}
          </div>
          {count > 0 && <span>{count}</span>}
          <button onClick={() => onReply(comment)}>Reply</button>
          <span>{timeAgo(comment.createdAt)}</span>
          <div className="relative ml-auto">
            <button aria-label="Comment options" onClick={openMenu} className="rounded-full p-1 hover:bg-slate-200"><DotsIcon /></button>
            {menuOpen && <div className="absolute right-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-xl border bg-white py-1 text-sm shadow-xl">
              {isOwner && <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Edit</button>}
              {canDelete && <button onClick={remove} className="block w-full px-3 py-2 text-left text-red-600 hover:bg-slate-50">Delete</button>}
              <button onClick={copy} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Copy</button>
              {!isOwner && <button onClick={report} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Report</button>}
            </div>}
          </div>
        </div>
        {depth === 0 && replies.length > 0 && <button onClick={() => setShowReplies((v) => !v)} className="mt-2 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900">{showReplies ? 'Hide replies' : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}</button>}
      </div>
    </div>
    {showReplies && depth === 0 && replies.map((reply) => <CommentRow key={reply.id} comment={reply} currentUserId={currentUserId} reelOwner={reelOwner} onReply={onReply} onChanged={onChanged} depth={1} />)}
  </div>;
}

export default function ReelCommentsModal({ reelId, reelOwner, currentUserId, comments, onClose, onCountChange }: { reelId: string; reelOwner: boolean; currentUserId?: string; comments: CommentNode[]; onClose: () => void; onCountChange: (delta: number) => void }) {
  const [items, setItems] = useState<CommentNode[]>(comments || []);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  useEffect(() => setItems(comments || []), [comments]);
  useEffect(() => { const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; }; }, []);

  function beginDrag(y: number) { startY.current = y; setDragging(true); }
  function moveDrag(y: number) { if (!dragging) return; const delta = y - startY.current; if (delta > 0) setDragY(delta); }
  function endDrag() { if (!dragging) return; setDragging(false); if (dragY > CLOSE_THRESHOLD) onClose(); setDragY(0); }

  async function send() {
    const content = text.trim();
    if (!content) return;
    const result = await addReelComment(reelId, content, replyTo?.id);
    if (!result.success) return;
    setText('');
    setReplyTo(null);
    onCountChange(replyTo ? 0 : 1);
    const added = { ...result.data.comment, author: result.data.comment.user, reactionCount: 0, myReaction: null, replies: [] } as CommentNode;
    setItems((prev) => {
      if (!replyTo) return [...prev, added];
      const insert = (list: CommentNode[]): CommentNode[] => list.map((c) => c.id === replyTo.id ? { ...c, replies: [...(c.replies || []), added] } : { ...c, replies: insert(c.replies || []) });
      return insert(prev);
    });
  }
  function changed(topLevel: boolean) {
    if (topLevel) onCountChange(-1);
    window.dispatchEvent(new CustomEvent('reel-comments-refresh', { detail: reelId }));
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
    <div className="flex h-[88vh] w-full max-w-xl flex-col rounded-t-2xl bg-white" style={{ transform: `translateY(${dragY}px)`, transition: dragging ? 'none' : 'transform 0.2s ease' }} onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col items-center py-2 touch-none" onTouchStart={(e) => beginDrag(e.touches[0].clientY)} onTouchMove={(e) => moveDrag(e.touches[0].clientY)} onTouchEnd={endDrag}><span className="h-1 w-10 rounded-full bg-slate-300" /></div>
      <div className="border-b px-4 py-2 text-center font-semibold">Comments</div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">{items.length === 0 ? <p className="pt-8 text-center text-sm text-slate-400">No comments yet. Be the first to comment.</p> : items.map((comment) => <CommentRow key={comment.id} comment={comment} currentUserId={currentUserId} reelOwner={reelOwner} onReply={(c) => { setReplyTo(c); setText(`@${c.author.displayName || c.author.username || 'user'} `); }} onChanged={changed} />)}</div>
      <div className="border-t p-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        {replyTo && <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>Replying to {replyTo.author.displayName || replyTo.author.username}</span><button onClick={() => { setReplyTo(null); setText(''); }}>Cancel</button></div>}
        <div className="flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'} className="flex-1 rounded-full border px-4 py-2 text-sm" /><button onClick={send} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">Send</button></div>
      </div>
    </div>
  </div>;
}
