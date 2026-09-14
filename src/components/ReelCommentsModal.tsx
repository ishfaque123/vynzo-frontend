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
  return `${Math.floor(hours / 24)}d`;
}

function Avatar({ author }: { author: CommentNode['author'] }) {
  return (
    <Link href={author.username ? `/u/${author.username}` : '#'} className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-200 bg-cover bg-center text-center text-xs font-semibold leading-8 text-slate-600" style={author.profilePictureUrl ? { backgroundImage: `url(${author.profilePictureUrl})` } : {}}>
      {!author.profilePictureUrl && (author.displayName?.[0]?.toUpperCase() || '?')}
    </Link>
  );
}

function CommentRow({ comment, currentUserId, reelOwner, onReply, onChanged, depth = 0 }: { comment: CommentNode; currentUserId?: string; reelOwner: boolean; onReply: (comment: CommentNode) => void; onChanged: () => void; depth?: number }) {
  const [picker, setPicker] = useState(false);
  const [reaction, setReaction] = useState<string | null>(comment.myReaction);
  const [count, setCount] = useState(comment.reactionCount || 0);
  const [busy, setBusy] = useState(false);
  const canDelete = currentUserId === comment.author.id || reelOwner;

  useEffect(() => {
    setReaction(comment.myReaction);
    setCount(comment.reactionCount || 0);
  }, [comment.myReaction, comment.reactionCount]);

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
    if (!canDelete || !confirm('Delete this comment?')) return;
    const result = await deleteReelComment(comment.id);
    if (result.success) onChanged();
  }

  return (
    <div className={depth > 0 ? 'ml-9 mt-2' : 'mb-3'}>
      <div className="flex items-start gap-2">
        <Avatar author={comment.author} />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-slate-100 px-3 py-2">
            <p className="text-sm font-semibold">{comment.author.displayName || comment.author.username || 'User'}</p>
            <p className="break-words text-sm">{comment.content}</p>
          </div>
          <div className="mt-1 flex items-center gap-3 px-2 text-xs text-slate-500">
            <div className="relative">
              <button onClick={() => setPicker((v) => !v)} className={reaction ? 'font-semibold text-blue-600' : ''}>{reaction ? REACTIONS[reaction] : 'Like'}</button>
              {picker && (
                <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-full border bg-white p-1 shadow-lg">
                  {Object.entries(REACTIONS).map(([key, emoji]) => <button key={key} onClick={() => react(key)} className="text-lg hover:scale-125">{emoji}</button>)}
                </div>
              )}
            </div>
            {count > 0 && <span>{count}</span>}
            <button onClick={() => onReply(comment)}>Reply</button>
            <span>{timeAgo(comment.createdAt)}</span>
            {canDelete && <button onClick={remove} className="ml-auto text-red-500">Delete</button>}
          </div>
        </div>
      </div>
      {(comment.replies || []).map((reply) => (
        <CommentRow key={reply.id} comment={reply} currentUserId={currentUserId} reelOwner={reelOwner} onReply={onReply} onChanged={onChanged} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function ReelCommentsModal({ reelId, reelOwner, currentUserId, comments, onClose, onCountChange }: { reelId: string; reelOwner: boolean; currentUserId?: string; comments: CommentNode[]; onClose: () => void; onCountChange: (delta: number) => void }) {
  const [items, setItems] = useState<CommentNode[]>(comments || []);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setItems(comments || []), [comments]);
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; };
  }, []);

  function beginDrag(y: number) { startY.current = y; setDragging(true); }
  function moveDrag(y: number) {
    if (!dragging) return;
    const delta = y - startY.current;
    if (delta > 0) setDragY(delta);
  }
  function endDrag() {
    if (!dragging) return;
    setDragging(false);
    if (dragY > CLOSE_THRESHOLD) onClose();
    setDragY(0);
  }

  async function send() {
    const content = text.trim();
    if (!content) return;
    const result = await addReelComment(reelId, content, replyTo?.id);
    if (!result.success) return;
    setText('');
    setReplyTo(null);
    onCountChange(replyTo ? 0 : 1);
    const added = { ...result.data.comment, author: result.data.comment.user, reactionCount: 0, myReaction: null, replies: [] } as CommentNode;
    if (added.replies == null) added.replies = [];
    setItems((prev) => {
      if (!replyTo) return [...prev, added];
      const insert = (list: CommentNode[]): CommentNode[] => list.map((c) => c.id === replyTo.id ? { ...c, replies: [...(c.replies || []), added] } : { ...c, replies: insert(c.replies || []) });
      return insert(prev);
    });
  }

  function changed() {
    window.dispatchEvent(new CustomEvent('reel-comments-refresh', { detail: reelId }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="flex h-[88vh] w-full max-w-xl flex-col rounded-t-2xl bg-white" style={{ transform: `translateY(${dragY}px)`, transition: dragging ? 'none' : 'transform 0.2s ease' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center py-2" onTouchStart={(e) => beginDrag(e.touches[0].clientY)} onTouchMove={(e) => moveDrag(e.touches[0].clientY)} onTouchEnd={endDrag}>
          <span className="h-1 w-10 rounded-full bg-slate-300" />
        </div>
        <div className="border-b px-4 py-2 text-center font-semibold">Comments</div>
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain">
          {items.length === 0 ? <p className="pt-8 text-center text-sm text-slate-400">No comments yet. Be the first to comment.</p> : items.map((comment) => <CommentRow key={comment.id} comment={comment} currentUserId={currentUserId} reelOwner={reelOwner} onReply={(c) => { setReplyTo(c); setText(`@${c.author.displayName || c.author.username || 'user'} `); }} onChanged={changed} />)}
        </div>
        <div className="border-t p-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          {replyTo && <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>Replying to {replyTo.author.displayName || replyTo.author.username}</span><button onClick={() => { setReplyTo(null); setText(''); }}>Cancel</button></div>}
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'} className="flex-1 rounded-full border px-4 py-2 text-sm" />
            <button onClick={send} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
