'use client';

import { useState } from 'react';
import Link from 'next/link';
import { setCommentReaction, deleteComment, editComment } from '@/lib/api/commentApi';

const REACTIONS: Record<string, string> = { like: '👍', love: '❤️', haha: '😆', wow: '😮', sad: '😢', angry: '😠' };

function Avatar({ url, name }: { url?: string; name?: string }) {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center text-[10px] font-semibold text-slate-600" style={url ? { backgroundImage: `url(${url})` } : {}}>
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}
function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function formatCount(n: number) {
  if (n < 1000) return `${n}`;
  if (n < 1000000) { const k = n / 1000; return `${k % 1 === 0 ? k : k.toFixed(1)}k`; }
  const m = n / 1000000; return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
}

export default function CommentItem({ comment, currentUser, postOwnerId, onReplyClick, onChanged, depth = 0 }: any) {
  const [showPicker, setShowPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const isOwner = currentUser?.id === comment.author.id;
  const canDelete = isOwner || currentUser?.id === postOwnerId;

  async function react(type: string) {
    setShowPicker(false);
    const result = await setCommentReaction(comment.id, type);
    if (result.success) onChanged();
  }

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return;
    const result = await deleteComment(comment.id);
    if (result.success) onChanged();
    setMenuOpen(false);
  }

  async function saveEdit() {
    const result = await editComment(comment.id, editText);
    if (result.success) { onChanged(); setEditing(false); }
  }

  function copyComment() {
    navigator.clipboard.writeText(comment.content);
    setMenuOpen(false);
  }

  return (
    <div className={depth > 0 ? 'ml-8 mt-2' : 'mb-3'}>
      <div className="flex items-start gap-2">
        <Link href={`/u/${comment.author.username}`}><Avatar url={comment.author.profilePictureUrl} name={comment.author.displayName} /></Link>
        <div className="flex-1">
          <div className="rounded-2xl bg-slate-100 px-3 py-2">
            <Link href={`/u/${comment.author.username}`} className="text-sm font-semibold hover:underline">{comment.author.displayName}</Link>
            {editing ? (
              <div className="mt-1 flex gap-1">
                <input value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 rounded border px-2 py-1 text-sm" />
                <button onClick={saveEdit} className="text-xs font-semibold text-blue-600">Save</button>
              </div>
            ) : (
              <p className="text-sm">
                {comment.content}
                {comment.taggedUsers?.length > 0 && (
                  <span className="text-slate-500"> with {comment.taggedUsers.map((t: any) => t.displayName).join(', ')}</span>
                )}
              </p>
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 px-2 text-xs text-slate-500">
            <div className="relative">
              <button onClick={() => setShowPicker(!showPicker)} className={comment.myReaction ? 'font-semibold text-blue-600' : ''}>
                {comment.myReaction ? REACTIONS[comment.myReaction] : 'Like'}
              </button>
              {showPicker && (
                <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-full border bg-white p-1 shadow-lg" onMouseLeave={() => setShowPicker(false)}>
                  {Object.entries(REACTIONS).map(([key, emoji]) => (
                    <button key={key} onClick={() => react(key)} className="text-lg hover:scale-125">{emoji}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onReplyClick(comment.id, comment.author.displayName)}>Reply</button>
            {comment.reactionCount > 0 && <span>{formatCount(comment.reactionCount)}</span>}
            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>

            <div className="relative ml-auto">
              <button onClick={() => setMenuOpen(!menuOpen)}><DotsIcon /></button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border bg-white py-1 text-sm shadow-lg" onMouseLeave={() => setMenuOpen(false)}>
                  {isOwner && <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">Edit</button>}
                  {canDelete && <button onClick={handleDelete} className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-slate-50">Delete</button>}
                  <button onClick={copyComment} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">Copy</button>
                  <button onClick={() => { alert('Reported.'); setMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">Report</button>
                </div>
              )}
            </div>
          </div>

          {comment.replies?.map((reply: any) => (
            <CommentItem key={reply.id} comment={reply} currentUser={currentUser} postOwnerId={postOwnerId} onReplyClick={onReplyClick} onChanged={onChanged} depth={depth + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
