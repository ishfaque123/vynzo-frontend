'use client';

import { useState } from 'react';
import CommentItem from './CommentItem';

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}

// Flattens an arbitrarily deep reply tree into a single-level chronological
// list, tracking each reply's REAL immediate parent (for the blue
// "@username" mention) separately from its display depth (always 1). This
// is what stops "reply to a reply to a reply..." from drifting further and
// further to the right — everything renders at the same indent, Facebook
// style, with the @mention showing who it was actually aimed at.
function flattenReplies(replies: any[] | undefined, parentAuthor: any): any[] {
  const flat: any[] = [];
  for (const r of replies || []) {
    flat.push({ ...r, parentAuthor });
    if (r.replies?.length) {
      flat.push(...flattenReplies(r.replies, r.author));
    }
  }
  flat.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return flat;
}

export default function CommentsModal({ post, currentUser, comments, commentText, setCommentText, replyTo, setReplyTo, onAddComment, onCommentsChanged, onClose }: any) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="flex h-[85vh] w-full max-w-xl flex-col rounded-t-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="w-6" />
          <p className="font-semibold">Comments</p>
          <button onClick={onClose} aria-label="Close" className="text-slate-500"><CloseIcon /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {(comments || []).length === 0 ? (
            <p className="pt-6 text-center text-sm text-slate-400">No comments yet. Be the first to comment.</p>
          ) : (
            (comments || []).map((c: any) => {
              const flatReplies = flattenReplies(c.replies, c.author);
              const isExpanded = expandedIds.has(c.id);
              return (
                <div key={c.id} className="mb-3">
                  <CommentItem comment={c} currentUser={currentUser} postOwnerId={post.author.id}
                    onReplyClick={(id: string, name: string) => setReplyTo({ postId: post.id, commentId: id, name })}
                    onChanged={() => onCommentsChanged(post.id)} depth={0} />

                  {flatReplies.length > 0 && (
                    <div className="ml-8 mt-1 pl-4">
                      {!isExpanded ? (
                        <button onClick={() => toggleExpand(c.id)} className="text-xs font-semibold text-slate-500 hover:underline">
                          View {flatReplies.length} {flatReplies.length === 1 ? 'reply' : 'replies'}
                        </button>
                      ) : (
                        <>
                          {flatReplies.map((r: any) => (
                            <CommentItem key={r.id} comment={r} currentUser={currentUser} postOwnerId={post.author.id}
                              onReplyClick={(id: string, name: string) => setReplyTo({ postId: post.id, commentId: id, name })}
                              onChanged={() => onCommentsChanged(post.id)} depth={1} parentAuthor={r.parentAuthor} />
                          ))}
                          <button onClick={() => toggleExpand(c.id)} className="mt-1 text-xs font-semibold text-slate-500 hover:underline">
                            Hide replies
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t px-4 py-3">
          {replyTo?.postId === post.id && (
            <p className="mb-2 text-xs text-slate-500">Replying to <b>{replyTo.name}</b> <button onClick={() => setReplyTo(null)} className="text-red-500">✕</button></p>
          )}
          <div className="flex gap-2">
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1 rounded-lg border px-3 py-2 text-sm" />
            <button onClick={() => onAddComment(post.id)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
