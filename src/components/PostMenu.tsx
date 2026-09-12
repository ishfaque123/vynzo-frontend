'use client';

import { useRef, useState } from 'react';
import { updatePost, deletePost, reportPost, hidePost } from '@/lib/api/postApi';
import { toggleFollow } from '@/lib/api/userApi';
import { createShareLink } from '@/lib/api/shareApi';
import Toast from './Toast';

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
    </svg>
  );
}
function CommentSettingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function UnfollowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 014-4h6" /><line x1="17" y1="8" x2="22" y2="13" /><line x1="22" y1="8" x2="17" y2="13" />
    </svg>
  );
}
function NotInterestedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><line x1="7" y1="7" x2="17" y2="17" />
    </svg>
  );
}

const CLOSE_THRESHOLD_PX = 100;

export default function PostMenu({
  postId,
  authorId,
  isOwner,
  content,
  commentAudience,
  friendStatus,
  onUpdated,
  onDeleted,
}: {
  postId: string;
  authorId: string;
  isOwner: boolean;
  content: string;
  commentAudience: string;
  friendStatus?: string;
  onUpdated: (content: string, commentAudience: string) => void;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [editing, setEditing] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [editText, setEditText] = useState(content);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  const isFollowingAuthor = friendStatus === 'following' || friendStatus === 'friends';

  function closeMenu() {
    setOpen(false);
    setAudienceOpen(false);
    setDragY(0);
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
      if (current > CLOSE_THRESHOLD_PX) closeMenu();
      return 0;
    });
  }

  async function saveEdit() {
    const result = await updatePost(postId, { content: editText });
    if (result.success) {
      onUpdated(result.data.post.content, result.data.post.commentAudience);
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return;
    const result = await deletePost(postId);
    if (result.success) onDeleted();
  }

  async function setAudience(value: string) {
    const result = await updatePost(postId, { commentAudience: value });
    if (result.success) {
      onUpdated(result.data.post.content, result.data.post.commentAudience);
      closeMenu();
    }
  }

  async function copyLink() {
    closeMenu();
    const result = await createShareLink('post', postId);
    const link = result.success ? `${window.location.origin}/s/${result.data.code}` : `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(link);
    setToast({ message: 'Link copied!', type: 'success' });
  }

  async function handleUnfollow() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await toggleFollow(authorId);
      if (result.success) {
        setToast({ message: 'Unfollowed successfully.', type: 'success' });
      } else {
        setToast({ message: 'Could not update follow status. Please try again.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Could not update follow status. Please try again.', type: 'error' });
    } finally {
      setBusy(false);
      closeMenu();
    }
  }

  async function handleReport() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await reportPost(postId);
      if (result.success) {
        setToast({ message: 'Post reported. Thanks for letting us know.', type: 'success' });
      } else {
        setToast({ message: result.error?.message || 'Could not report this post.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Could not report this post. Please try again.', type: 'error' });
    } finally {
      setBusy(false);
      closeMenu();
    }
  }

  async function handleHide() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await hidePost(postId);
      if (result.success) onDeleted();
      else setToast({ message: 'Could not hide this post. Please try again.', type: 'error' });
    } catch {
      setToast({ message: 'Could not hide this post. Please try again.', type: 'error' });
    } finally {
      setBusy(false);
      closeMenu();
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(true)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
        <DotsIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={closeMenu}
        >
          <div
            className="w-full max-w-xl rounded-t-2xl bg-white p-2 pb-6"
            style={{
              transform: `translateY(${dragY}px)`,
              transition: dragY === 0 ? 'transform 0.2s ease' : 'none',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => dragStart(e.touches[0].clientY)}
            onTouchMove={(e) => dragMove(e.touches[0].clientY)}
            onTouchEnd={dragEnd}
          >
            <div
              className="flex cursor-grab flex-col items-center pt-2 pb-2 active:cursor-grabbing"
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

            {isOwner ? (
              <>
                <button onClick={() => { setEditing(true); closeMenu(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50">
                  <EditIcon /> Edit
                </button>
                <button onClick={copyLink} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50">
                  <LinkIcon /> Copy link
                </button>
                <button onClick={() => setAudienceOpen(!audienceOpen)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50">
                  <CommentSettingIcon /> Who can comment
                </button>
                {audienceOpen && (
                  <div className="ml-8 border-l pl-2">
                    {['everyone', 'followers', 'only_me'].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAudience(v)}
                        className={`block w-full px-2 py-2 text-left text-xs ${commentAudience === v ? 'font-semibold text-slate-900' : 'text-slate-500'}`}
                      >
                        {v === 'everyone' ? 'Everyone' : v === 'followers' ? 'Followers' : 'Only me'}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={handleDelete} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-slate-50">
                  <TrashIcon /> Delete
                </button>
              </>
            ) : (
              <>
                <button onClick={copyLink} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50">
                  <LinkIcon /> Copy link
                </button>
                <button disabled={busy} onClick={handleReport} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 disabled:opacity-50">
                  <FlagIcon /> Report post
                </button>
                {isFollowingAuthor && (
                  <button disabled={busy} onClick={handleUnfollow} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 disabled:opacity-50">
                    <UnfollowIcon /> Unfollow
                  </button>
                )}
                <button disabled={busy} onClick={handleHide} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 disabled:opacity-50">
                  <NotInterestedIcon /> Not interested
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4">
            <h3 className="mb-2 font-semibold">Edit Post</h3>
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} className="w-full rounded-lg border p-2" />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded-lg border px-4 py-1.5 text-sm">Cancel</button>
              <button onClick={saveEdit} className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
