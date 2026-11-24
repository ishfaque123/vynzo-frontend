'use client';

import { useEffect, useRef, useState } from 'react';
import CommentItem from './CommentItem';
import Avatar from './Avatar';
import CommentEmojiPicker from './CommentEmojiPicker';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [posting, setPosting] = useState(false);
  const postingRef = useRef(false);

  async function searchMentions(q: string) {
    if (mentionTimer.current) clearTimeout(mentionTimer.current);
    if (!q.trim()) { setMentionResults([]); setMentionQuery(null); return; }
    mentionTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}&limit=5`, { credentials: 'include' });
        const data = await res.json();
        setMentionResults(data.data?.users || data.users || []);
        setMentionIndex(0);
      } catch { setMentionResults([]); }
    }, 300);
  }

  function applyMention(user: any) {
    if (mentionQuery === null) return;
    // Replace @query with @username
    const before = commentText.slice(0, commentText.lastIndexOf('@' + mentionQuery));
    const after = commentText.slice(commentText.lastIndexOf('@' + mentionQuery) + mentionQuery.length + 1);
    const next = before + '@' + user.username + ' ' + after;
    setCommentText(next);
    setMentionQuery(null);
    setMentionResults([]);
    // Resize textarea
    if (inputRef.current) {
      const el = inputRef.current as any;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
      el.focus();
    }
  }

  function handleMentionInput(value: string) {
    setCommentText(value);
    setSubmitError(null);
    // Detect @query at cursor
    const cursorPos = (inputRef.current as any)?.selectionStart ?? value.length;
    const textBefore = value.slice(0, cursorPos);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      searchMentions(match[1]);
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  }

  function insertEmoji(emoji: string) {
    const el = inputRef.current as any;
    const start = el?.selectionStart ?? commentText.length;
    const end = el?.selectionEnd ?? commentText.length;
    const next = commentText.slice(0, start) + emoji + commentText.slice(end);
    handleMentionInput(next);
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        const pos = start + emoji.length;
        el.setSelectionRange?.(pos, pos);
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
      }
    });
  }

  async function handleSend() {
    if (postingRef.current || !commentText.trim()) return;
    postingRef.current = true;
    setPosting(true);
    setSubmitError(null);
    try {
      const r = await onAddComment(post.id);
      if (r && !r.success) setSubmitError(r.error?.message || 'Could not post your comment.');
      else {
        setReplyTo(null);
        window.dispatchEvent(new CustomEvent('frianzo-comment-count', { detail: { postId: post.id, delta: 1 } }));
        if (inputRef.current) (inputRef.current as any).style.height = 'auto';
      }
    } finally {
      postingRef.current = false;
      setPosting(false);
    }
  }

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  useEffect(() => {
    function updateViewport() {
      const vv = window.visualViewport;
      if (vv) setViewport({ top: vv.offsetTop, height: vv.height });
    }
    updateViewport();
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  function startReply(id: string, name: string) {
    setReplyTo({ postId: post.id, commentId: id, name });
    setCommentText('');
    inputRef.current?.focus();
  }

  function cancelReply() {
    setReplyTo(null);
    setSubmitError(null);
    if (inputRef.current) (inputRef.current as any).style.height = 'auto';
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

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionTimer = useRef<any>(null);
  const authorId = post?.author?.id || post?.userId;
  const canComment = post?.commentAudience !== 'only_me' || !currentUser || currentUser.id === authorId;

  const wrapperStyle: React.CSSProperties = viewport
    ? { position: 'fixed', top: viewport.top, left: 0, right: 0, height: viewport.height }
    : { position: 'fixed', inset: 0 };

  const modalHeight = viewport ? Math.round(viewport.height * 0.9) : undefined;

  return (
    <div className="z-50 flex items-end justify-center bg-black/40" style={wrapperStyle} onClick={onClose}>
      <div
        className="flex w-full max-w-xl flex-col rounded-t-2xl bg-white"
        style={{
          height: modalHeight ? `${modalHeight}px` : '85vh',
          maxHeight: '100%',
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? 'transform 0.2s ease' : 'none',
        }}
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
        <div className="relative flex items-center justify-center border-b px-4 py-2">
          <p className="font-semibold">Comments</p>
          <div className="absolute left-3 flex rounded-full bg-slate-100 p-0.5 text-xs">
            <button
              onClick={() => setSortBy('top')}
              className={`rounded-full px-2.5 py-1 font-medium transition-colors ${sortBy === 'top' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >Top</button>
            <button
              onClick={() => setSortBy('newest')}
              className={`rounded-full px-2.5 py-1 font-medium transition-colors ${sortBy === 'newest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >Newest</button>
          </div>
          <button onClick={onClose} aria-label="Close comments" className="absolute right-3 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
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
            [...(comments || [])].sort((a: any, b: any) =>
              sortBy === 'top'
                ? (b.reactionCount || 0) - (a.reactionCount || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ).map((c: any) => {
              const flatReplies = flattenReplies(c.replies, c.author);
              const isExpanded = expandedIds.has(c.id);
              return (
                <div key={c.id} className="mb-3">
                  <CommentItem comment={c} currentUser={currentUser} postOwnerId={post.author.id}
                    onReplyClick={startReply}
                    onChanged={(action: string) => {
                      if (action === 'delete') window.dispatchEvent(new CustomEvent('frianzo-comment-count', { detail: { postId: post.id, delta: -1 } }));
                      onCommentsChanged(post.id);
                    }} depth={0} />

                  {flatReplies.length > 0 && (
                    <div className="ml-9 mt-1 border-l-2 border-slate-200/60 pl-3">
                      {!isExpanded ? (
                        <button onClick={() => toggleExpand(c.id)} className="text-xs font-semibold text-slate-500 hover:underline">
                          View {flatReplies.length} {flatReplies.length === 1 ? 'reply' : 'replies'}
                        </button>
                      ) : (
                        <>
                          {flatReplies.map((r: any) => (
                            <CommentItem key={r.id} comment={r} currentUser={currentUser} postOwnerId={post.author.id}
                              onReplyClick={startReply}
                              onChanged={(action: string) => {
                                if (action === 'delete') window.dispatchEvent(new CustomEvent('frianzo-comment-count', { detail: { postId: post.id, delta: -1 } }));
                                onCommentsChanged(post.id);
                              }} depth={1} parentAuthor={r.parentAuthor} />
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

        <div className="border-t px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          {!canComment ? (
            <p className="py-1 text-center text-sm text-slate-500">Only the author can comment on this post.</p>
          ) : (
            <>
              {submitError && <p className="mb-2 text-sm text-red-600">{submitError}</p>}
              {replyTo && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-1.5 text-sm">
                  <span className="text-slate-600">Replying to <span className="font-semibold text-blue-600">@{replyTo.name}</span></span>
                  <button onClick={cancelReply} aria-label="Cancel reply" className="rounded-full p-1 text-slate-400 hover:bg-blue-100 hover:text-slate-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </div>
              )}
              {mentionQuery !== null && mentionResults.length > 0 && (
                <div className="mb-2 overflow-hidden rounded-xl border bg-white shadow-lg">
                  {mentionResults.map((u: any, i: number) => (
                    <button
                      key={u.id}
                      onClick={() => applyMention(u)}
                      onMouseEnter={() => setMentionIndex(i)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 ${i === mentionIndex ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center text-xs font-semibold text-slate-600" style={u.profilePictureUrl ? { backgroundImage: `url(${u.profilePictureUrl})` } : {}}>
                        {!u.profilePictureUrl && (u.displayName?.[0]?.toUpperCase() || '?')}
                      </div>
                      <div>
                        <p className="font-semibold leading-tight">{u.displayName}</p>
                        <p className="text-xs text-slate-500 leading-tight">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <Avatar url={currentUser?.profilePictureUrl} name={currentUser?.displayName} px={32} />
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef as any}
                    value={commentText}
                    rows={1}
                    onChange={(e) => {
                      handleMentionInput(e.target.value);
                      // Auto-grow
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (mentionQuery !== null && mentionResults.length > 0) {
                        if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((i) => (i + 1) % mentionResults.length); return; }
                        if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((i) => (i - 1 + mentionResults.length) % mentionResults.length); return; }
                        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applyMention(mentionResults[mentionIndex]); return; }
                        if (e.key === 'Escape') { setMentionQuery(null); setMentionResults([]); return; }
                      }
                    }}

                    placeholder="Write a comment..."
                    className="max-h-[120px] w-full resize-none overflow-y-auto rounded-3xl border py-2 pl-3 pr-11 text-sm"
                  />
                  <div className="absolute bottom-1 right-1.5">
                    <CommentEmojiPicker onInsert={insertEmoji} />
                  </div>
                </div>
                <button onClick={handleSend} disabled={posting || !commentText.trim()} aria-label="Send comment" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white transition disabled:opacity-50">
                  {posting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4l17.8-7.5c.8-.35.8-1.45 0-1.8L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .72.73 1.2 1.39.91z" /></svg>
                  )}
                </button>
              </div>

            </>
          )}
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
