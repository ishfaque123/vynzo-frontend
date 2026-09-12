'use client';

import { useEffect, useRef, useState } from 'react';
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

// Only one post's 3-dot menu should ever be open at a time on the page.
// Whichever menu is currently open registers its own close function here;
// opening a different one closes the previous one first.
let closeActiveMenu: (() => void) | null = null;

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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [editing, setEditing] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [editText, setEditText] = useState(content);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isFollowingAuthor = friendStatus === 'following' || friendStatus === 'friends';

  function closeMenu() {
    setOpen(false);
    setAudienceOpen(false);
  }

  // Positioned with fixed (viewport) coordinates computed from the actual
  // button location, so a short post card's overflow-hidden can never
  // clip or misplace the dropdown — it always renders relative to the
  // screen, not to the card.
  function openMenu() {
    if (closeActiveMenu) closeActiveMenu();
    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const menuWidth = 224;
      const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 280 && rect.top > 280;
      setMenuStyle(
        openUpward
          ? { position: 'fixed', left, bottom: window.innerHeight - rect.top + 4, zIndex: 60 }
          : { position: 'fixed', left, top: rect.bottom + 4, zIndex: 60 }
      );
    }
    setOpen(true);
    closeActiveMenu = closeMenu;
  }

  function toggleMenu() {
    if (open) closeMenu();
    else openMenu();
  }

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      closeMenu();
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeActiveMenu === closeMenu) closeActiveMenu = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <button ref={buttonRef} onClick={toggleMenu} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
        <DotsIcon />
      </button>

      {open && (
        <div ref={menuRef} style={menuStyle} className="w-56 rounded-lg border bg-white py-1 shadow-lg">
          {isOwner ? (
            <>
              <button onClick={() => { setEditing(true); closeMenu(); }} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50">
                <EditIcon /> Edit
              </button>
              <button onClick={copyLink} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50">
                <LinkIcon /> Copy link
              </button>
              <button onClick={() => setAudienceOpen(!audienceOpen)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50">
                <CommentSettingIcon /> Who can comment
              </button>
              {audienceOpen && (
                <div className="ml-8 border-l pl-2">
                  {['everyone', 'followers', 'only_me'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAudience(v)}
                      className={`block w-full px-2 py-1.5 text-left text-xs ${commentAudience === v ? 'font-semibold text-slate-900' : 'text-slate-500'}`}
                    >
                      {v === 'everyone' ? 'Everyone' : v === 'followers' ? 'Followers' : 'Only me'}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={handleDelete} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50">
                <TrashIcon /> Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={copyLink} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50">
                <LinkIcon /> Copy link
              </button>
              <button disabled={busy} onClick={handleReport} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50">
                <FlagIcon /> Report post
              </button>
              {isFollowingAuthor && (
                <button disabled={busy} onClick={handleUnfollow} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50">
                  <UnfollowIcon /> Unfollow
                </button>
              )}
              <button disabled={busy} onClick={handleHide} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50">
                <NotInterestedIcon /> Not interested
              </button>
            </>
          )}
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
