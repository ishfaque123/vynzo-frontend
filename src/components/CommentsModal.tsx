'use client';

import { useEffect, useRef, useState } from 'react';
import CommentItem from './CommentItem';

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

const CLOSE_THRESHOLD_PX = 100;

export default function CommentsModal({ post, currentUser, comments, commentText, setCommentText, replyTo, setReplyTo, onAddComment, onCommentsChanged, onClose }: any) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dragY, setDragY] = useState(0);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Handle-bar drag: works from anywhere on the handle, regardless of list scroll position.
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

  // List drag: only takes over once the list is already scrolled to the very
  // top AND the finger keeps moving down from there — like Instagram/Facebook.
  // Until that happens, normal scrolling is left completely alone.
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
        className="flex h-[85vh] w-full max-w-xl flex-col rounded-t-2xl bg-white"
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
        <div className="flex items-center justify-center border-b px-4 py-2">
          <p className="font-semibold">Comments</p>
        </div>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-3"
          onTouchStart={listTouchStart}
          onTouchMove={listTouchMove}
          onTouchEnd={listTouchEnd}
        >
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

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
}
