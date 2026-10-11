'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { useRef } from 'react';
import { fetchUserProfile, fetchFollowCounts, fetchFollowStatus, toggleFollow, blockUser, unblockUser, updateAvatar, updateCover } from '@/lib/api/userApi';
import { fetchUserPosts } from '@/lib/api/postApi';
import { fetchUserReels } from '@/lib/api/reelApi';
import { fetchHighlights, createHighlight, deleteHighlight } from '@/lib/api/highlightApi';
import { fetchStatusFeed } from '@/lib/api/statusApi';
import HighlightViewer from '@/components/HighlightViewer';
import { fetchComments, addComment } from '@/lib/api/commentApi';
import { createConversation } from '@/lib/api/messageApi';
import ShareModal from '@/components/ShareModal';
import FeedReelCard from '@/components/FeedReelCard';
import CommentsModal from '@/components/CommentsModal';
import PostCard from '@/components/PostCard';
import VerifiedBadge from '@/components/VerifiedBadge';
import Toast from '@/components/Toast';
import Skeleton from '@/components/Skeleton';

function playSubmitSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function ShareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
      <line x1="8.3" y1="10.7" x2="15.7" y2="6.3" /><line x1="8.3" y1="13.3" x2="15.7" y2="17.7" />
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-xl pb-6" role="status" aria-label="Loading profile">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="px-4">
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full border-4 border-white" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-3 w-24" />
        <Skeleton className="mt-3 h-3 w-4/5" />
        <Skeleton className="mt-2 h-3 w-3/5" />
        <div className="mt-4 flex border-y py-3">
          <div className="flex flex-1 flex-col items-center gap-2"><Skeleton className="h-4 w-8" /><Skeleton className="h-3 w-12" /></div>
          <div className="flex flex-1 flex-col items-center gap-2"><Skeleton className="h-4 w-8" /><Skeleton className="h-3 w-16" /></div>
          <div className="flex flex-1 flex-col items-center gap-2"><Skeleton className="h-4 w-8" /><Skeleton className="h-3 w-16" /></div>
        </div>
        <Skeleton className="mt-4 h-10 w-full rounded-lg" />
      </div>
      <div className="mt-4 flex border-y">
        <Skeleton className="mx-4 my-3 h-3 flex-1" />
        <Skeleton className="mx-4 my-3 h-3 flex-1" />
        <Skeleton className="mx-4 my-3 h-3 flex-1" />
      </div>
      <div className="mt-2">
        <div className="border-b-[8px] border-slate-100 bg-white p-3">
          <div className="flex items-center gap-2"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex flex-1 flex-col gap-1.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-16" /></div></div>
          <Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-4/5" />
          <Skeleton className="mt-3 h-48 w-full" />
          <div className="mt-3 flex gap-4"><Skeleton className="h-3 w-14" /><Skeleton className="h-3 w-14" /><Skeleton className="h-3 w-14" /></div>
        </div>
      </div>
    </div>
  );
}
function BlockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
    </svg>
  );
}

export default function ProfileClient() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [reels, setReels] = useState<any[]>([]);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'reels' | 'photos'>('all');
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
  const [shareModalPost, setShareModalPost] = useState<string | null>(null);
  const [shareProfileOpen, setShareProfileOpen] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedByOther, setBlockedByOther] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [viewHighlight, setViewHighlight] = useState<any | null>(null);
  const [createHlOpen, setCreateHlOpen] = useState(false);
  const [myStatuses, setMyStatuses] = useState<any[]>([]);
  const [hlSelected, setHlSelected] = useState<string[]>([]);
  const [hlTitle, setHlTitle] = useState('');
  const [hlSaving, setHlSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Photo is too large. Maximum size is 5MB.', type: 'error' });
      return;
    }
    setUploadingAvatar(true);
    const result = await updateAvatar(file);
    setUploadingAvatar(false);
    if (result.success) setProfile((prev: any) => ({ ...prev, profilePictureUrl: result.data.user.profilePictureUrl }));
    else setToast({ message: result.error?.message || 'Could not update photo.', type: 'error' });
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Cover photo is too large. Maximum size is 5MB.', type: 'error' });
      return;
    }
    setUploadingCover(true);
    const result = await updateCover(file);
    setUploadingCover(false);
    if (result.success) setProfile((prev: any) => ({ ...prev, coverPhotoUrl: result.data.user.coverPhotoUrl }));
    else setToast({ message: result.error?.message || 'Could not update cover photo.', type: 'error' });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setProfileError(false);
      try {
        const result = await fetchUserProfile(username);
        if (cancelled) return;

        if (result.success) {
          setProfile(result.data.user);
          setBlockedByMe(!!result.data.user.blockedByMe);
          setBlockedByOther(!!result.data.user.blockedByOther);
          fetchFollowCounts(result.data.user.id).then((c) => { if (c.success && !cancelled) setCounts(c.data); });
          setFriendStatus(result.data.user.friendStatus || 'none');
        } else if (result.error?.code === 'USER_NOT_FOUND') {
          setProfile(null);
        } else {
          setProfileError(true);
        }
      } catch {
        if (!cancelled) setProfileError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    fetchUserPosts(username).then((result) => {
      if (result.success) setPosts(result.data.posts);
      if (!cancelled) setPostsLoading(false);
    }).catch(() => {
      if (!cancelled) setPostsLoading(false);
    });
    fetchUserReels(username).then((result) => {
      if (result.success) setReels(result.data.reels);
      if (!cancelled) setReelsLoading(false);
    }).catch(() => {
      if (!cancelled) setReelsLoading(false);
    });

    fetchHighlights(username).then((result) => {
      if (result.success && !cancelled) setHighlights(result.data.highlights || []);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [username, retryKey]);

  async function handleFollow() {
    if (!profile || followBusy) return;
    setFollowBusy(true);
    try {
      const result = await toggleFollow(profile.id);
      if (result.success) {
        if (result.data.following) {
          setFriendStatus((prev) => (prev === 'follow_back' ? 'friends' : 'following'));
        } else {
          setFriendStatus('none');
          setToast({ message: `Unfollowed @${profile.username}`, type: 'success' });
        }
        setCounts((prev) => ({ ...prev, followers: Math.max(0, prev.followers + (result.data.following ? 1 : -1)) }));
      } else {
        setToast({ message: result.error?.message || 'Could not update follow status.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Could not update follow status. Please try again.', type: 'error' });
    } finally {
      setFollowBusy(false);
    }
  }

  function handleFollowClick() {
    if (followBusy) return;
    if (friendStatus === 'following' || friendStatus === 'friends') setConfirmUnfollow(true);
    else handleFollow();
  }

  async function copyProfileLink() {
    setMoreOpen(false);
    const url = `${window.location.origin}/u/${encodeURIComponent(profile.username)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setLinkCopied(true);
    setToast({ message: 'Profile link copied.', type: 'success' });
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function openCreateHighlight() {
    setCreateHlOpen(true);
    setHlSelected([]);
    setHlTitle('');
    try {
      const result = await fetchStatusFeed();
      if (result.success) {
        const mine = (result.data.statuses || []).filter((s: any) => s.userId === currentUser?.id || s.author?.id === currentUser?.id);
        setMyStatuses(mine);
      }
    } catch {}
  }

  async function handleCreateHighlight() {
    if (!hlTitle.trim() || hlSelected.length === 0 || hlSaving) return;
    setHlSaving(true);
    try {
      const result = await createHighlight(hlTitle.trim(), hlSelected);
      if (result.success) {
        setHighlights((prev) => [...prev, result.data.highlight]);
        setCreateHlOpen(false);
        setToast({ message: 'Highlight created.', type: 'success' });
      } else {
        setToast({ message: result.error?.message || 'Could not create highlight.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Could not create highlight.', type: 'error' });
    } finally {
      setHlSaving(false);
    }
  }

  async function handleDeleteHighlight(id: string) {
    const result = await deleteHighlight(id);
    if (result.success) {
      setHighlights((prev) => prev.filter((h) => h.id !== id));
      setViewHighlight(null);
      setToast({ message: 'Highlight deleted.', type: 'success' });
    }
  }

  async function handleMessage() {
    if (!profile || messaging) return;
    setMessaging(true);
    try {
      const result = await createConversation(profile.id);
      if (result.success) {
        router.push(`/messages/${result.data.id}`);
      } else {
        setToast({ message: result.error?.message || 'Could not start conversation.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Could not start conversation. Please try again.', type: 'error' });
    } finally {
      setMessaging(false);
    }
  }

  async function handleBlockToggle() {
    if (!profile || blockBusy) return;
    setBlockBusy(true);
    setMoreOpen(false);
    try {
      if (blockedByMe) {
        const result = await unblockUser(profile.id);
        if (result.success) setBlockedByMe(false);
      } else {
        const result = await blockUser(profile.id);
        if (result.success) {
          setBlockedByMe(true);
          setFriendStatus('none');
        }
      }
    } catch {
      setToast({ message: 'Could not update block status. Please try again.', type: 'error' });
    } finally {
      setBlockBusy(false);
    }
  }

  function handleReactionChange(postId: string, reaction: string | null, count: number) {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const newCounts = { ...(p.reactionCounts || {}) };
      if (p.myReaction) {
        newCounts[p.myReaction] = Math.max(0, (newCounts[p.myReaction] || 0) - 1);
        if (newCounts[p.myReaction] === 0) delete newCounts[p.myReaction];
      }
      if (reaction) {
        newCounts[reaction] = (newCounts[reaction] || 0) + 1;
      }
      return { ...p, myReaction: reaction, likeCount: count, reactionCounts: newCounts };
    }));
  }
  function handlePostUpdated(postId: string, content: string, commentAudience: string, isPinned?: boolean) {
    setPosts((prev) => {
      const updated = prev.map((p) => (p.id === postId ? { ...p, content, commentAudience, ...(isPinned !== undefined ? { isPinned } : {}) } : p));
      // Keep pinned posts at the top
      return [...updated].sort((a, b) => Number(b.isPinned || false) - Number(a.isPinned || false) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
  }
  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }
  async function loadComments(postId: string) {
    const result = await fetchComments(postId);
    if (result.success) setComments((prev) => ({ ...prev, [postId]: result.data.comments }));
  }
  async function handleToggleComments(postId: string) {
    setOpenComments(postId);
    if (!comments[postId]) await loadComments(postId);
  }
  async function handleAddComment(postId: string) {
    if (!commentText.trim()) return;
    const result = await addComment(postId, commentText, replyTo?.postId === postId ? replyTo.commentId : undefined);
    if (result.success) {
      playSubmitSound();
      await loadComments(postId);
      setCommentText('');
      setReplyTo(null);
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p)));
    } else {
      return result;
    }
  }

  if (loading) return <ProfileSkeleton />;
  if (profileError) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-slate-500">Could not load this profile. Please try again.</p>
        <button onClick={() => setRetryKey((k) => k + 1)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Try again
        </button>
      </div>
    );
  }
  if (!profile) return <p className="p-8 text-center text-slate-500">User not found.</p>;

  const isMe = currentUser?.username === profile.username;
  const photoPosts = posts.filter((p) => p.imageUrl);
  const openPost = posts.find((p) => p.id === openComments);
  const isPrivateView = !!profile.isPrivate && !isMe && friendStatus !== 'following' && friendStatus !== 'friends';
  const isBlockedView = blockedByMe || blockedByOther;

  return (
    <div className="mx-auto max-w-xl pb-6">
      <div className="relative">
        <div className="h-32 bg-cover bg-center bg-slate-200" style={{ backgroundImage: `url(${profile.coverPhotoUrl || '/images/default-cover.svg'})` }} />
        {isMe && (
          <>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="absolute bottom-2 right-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {uploadingCover ? 'Uploading...' : 'Edit cover'}
            </button>
          </>
        )}
      </div>

      <div className="px-4">
        <div className="-mt-10 mb-2 flex items-end justify-between">
          <div className="relative h-20 w-20 flex-shrink-0">
            <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-200 bg-cover bg-center" style={profile.profilePictureUrl ? { backgroundImage: `url(${profile.profilePictureUrl})` } : {}}>
              {!profile.profilePictureUrl && (
                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-600">{profile.displayName?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            {!isMe && profile.isOnline && (
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" aria-label="Online" />
            )}
            {isMe && (
              <>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white disabled:opacity-50"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="flex items-center">
            {!isMe && (
              <div className="relative">
                <button onClick={() => setMoreOpen(!moreOpen)} aria-label="More options" className="p-2 text-slate-600">
                  <MoreIcon />
                </button>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} onTouchStart={() => setMoreOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg">
                    <button onClick={copyProfileLink} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                      Copy link
                    </button>
                    <button disabled={blockBusy} onClick={() => { setMoreOpen(false); if (blockedByMe) handleBlockToggle(); else setConfirmBlock(true); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50 disabled:opacity-50">
                      <BlockIcon /> {blockedByMe ? 'Unblock' : 'Block'}
                    </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {!isMe && !blockedByOther && (
              <button onClick={handleMessage} disabled={messaging || blockedByMe} aria-label="Message" className="p-2 text-slate-600 disabled:opacity-40">
                <MessageIcon />
              </button>
            )}
            <button onClick={() => setShareProfileOpen(true)} aria-label="Share profile" className="p-2 text-slate-600">
              <ShareIcon />
            </button>
            {isMe && (
              <button onClick={copyProfileLink} aria-label="Copy profile link" className="p-2 text-slate-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
              </button>
            )}
          </div>
        </div>

        <h1 className="flex items-center gap-1.5 text-xl font-semibold">{profile.displayName}{profile.isVerified && <VerifiedBadge size="lg" />}</h1>
        <p className="text-slate-500">@{profile.username}</p>
        {!isMe && profile.isOnline && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active now
          </p>
        )}
        {!isMe && profile.mutualCount > 0 && (
          <p className="mt-1 text-sm text-slate-500">
            Followed by{' '}
            {profile.mutualFollowers.slice(0, 2).map((m: any, i: number) => (
              <span key={i}>
                {i > 0 && ', '}
                <Link href={`/u/${encodeURIComponent(m.username)}`} className="font-medium text-slate-700 hover:underline">
                  {m.displayName || `@${m.username}`}
                </Link>
              </span>
            ))}
            {profile.mutualCount > 2 && ` and ${profile.mutualCount - 2} other${profile.mutualCount - 2 > 1 ? 's' : ''}`}
          </p>
        )}
        {profile.bio && <p className="mt-2 text-slate-700">{profile.bio}</p>}
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-blue-600 hover:underline">{profile.website}</a>
        )}
        {(profile.city || profile.province) && (
          <p className="mt-1 text-sm text-slate-500">{[profile.city, profile.province].filter(Boolean).join(', ')}</p>
        )}

        <div className="mt-4 flex border-y py-3 text-sm">
          <span className="flex flex-1 flex-col items-center"><b>{posts.length}</b> <span className="text-xs text-slate-500">Posts</span></span>
          <span className="flex flex-1 flex-col items-center"><b>{reels.length}</b> <span className="text-xs text-slate-500">Reels</span></span>
          <Link href={`/u/${encodeURIComponent(profile.username)}/followers`} className="flex flex-1 flex-col items-center no-underline transition-transform duration-150 active:scale-95 focus:outline-none">
            <b>{counts.followers}</b> <span className="text-xs text-slate-500">Followers</span>
          </Link>
          <Link href={`/u/${encodeURIComponent(profile.username)}/following`} className="flex flex-1 flex-col items-center no-underline transition-transform duration-150 active:scale-95 focus:outline-none">
            <b>{counts.following}</b> <span className="text-xs text-slate-500">Following</span>
          </Link>
        </div>

        {isMe ? (
          <div className="mt-4 flex gap-2">
            <Link href="/edit-profile" className="flex-1 rounded-lg bg-slate-900 py-2 text-center text-sm font-semibold text-white">Edit Profile</Link>
            <Link href="/settings-menu/dashboard" className="flex-1 rounded-lg border py-2 text-center text-sm font-medium text-slate-700">Dashboard</Link>
          </div>
        ) : blockedByOther ? (
          <p className="mt-4 rounded-lg bg-slate-100 py-2.5 text-center text-sm text-slate-500">This user is unavailable.</p>
        ) : blockedByMe ? (
          <button onClick={handleBlockToggle} disabled={blockBusy} className="mt-4 w-full rounded-lg border py-2 font-medium text-slate-700 disabled:opacity-50">
            Unblock
          </button>
        ) : friendStatus === 'friends' ? (
          <button onClick={handleFollowClick} disabled={followBusy} className="mt-4 w-full rounded-lg bg-slate-100 py-2 font-medium text-slate-700 disabled:opacity-50">
            Friends
          </button>
        ) : (
          <button onClick={handleFollowClick} disabled={followBusy} className={`mt-4 w-full rounded-lg py-2 font-medium disabled:opacity-50 ${friendStatus === 'following' ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-white'}`}>
            {friendStatus === 'following' ? 'Following' : friendStatus === 'follow_back' ? 'Follow Back' : 'Follow'}
          </button>
        )}
      </div>

      {!isBlockedView && (highlights.length > 0 || isMe) && (
        <div className="mt-4 flex gap-4 overflow-x-auto px-4 pb-1">
          {isMe && (
            <button onClick={openCreateHighlight} className="flex w-16 shrink-0 flex-col items-center gap-1">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-2xl text-slate-400">+</span>
              <span className="max-w-full truncate text-xs text-slate-600">New</span>
            </button>
          )}
          {highlights.map((h) => (
            <button key={h.id} onClick={() => setViewHighlight(h)} className="flex w-16 shrink-0 flex-col items-center gap-1">
              <span className="h-16 w-16 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                {h.coverUrl ? (
                  <img src={h.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg text-slate-400">✦</span>
                )}
              </span>
              <span className="max-w-full truncate text-xs text-slate-600">{h.title}</span>
            </button>
          ))}
        </div>
      )}

      {isBlockedView ? (
        <div className="mt-4 flex flex-col items-center gap-2 border-y px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300 text-slate-500">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
            </svg>
          </span>
          <p className="text-base font-semibold text-slate-900">{blockedByMe ? 'You blocked this user' : 'This user is unavailable'}</p>
          <p className="text-sm text-slate-500">{blockedByMe ? 'Unblock them to see their posts and videos.' : ''}</p>
        </div>
      ) : isPrivateView ? (
        <div className="mt-4 flex flex-col items-center gap-2 border-y px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300 text-slate-500">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <p className="text-base font-semibold text-slate-900">This account is private</p>
          <p className="text-sm text-slate-500">Follow to see their photos and videos.</p>
        </div>
      ) : (
      <div className="mt-4 flex border-y">
        {(['all', 'reels', 'photos'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-center text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      )}

      {!isBlockedView && !isPrivateView && (
      <div className="mt-2">
        {activeTab === 'reels' ? (
          reelsLoading ? (
            <div className="flex justify-center py-6" role="status" aria-label="Loading reels"><div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" /></div>
          ) : reels.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500">No reels yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1 px-1">
              {reels.map((r) => (
                <Link key={r.id} href={`/reels?id=${r.id}`} className="relative aspect-[9/16] w-full overflow-hidden bg-slate-200">
                  {r.thumbnailUrl ? (
                    <img src={r.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <video src={`${r.videoUrl}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  )}
                  <svg className="absolute right-1.5 top-1.5 h-4 w-4 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </Link>
              ))}
            </div>
          )
        ) : activeTab === 'photos' ? (
          photoPosts.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1 px-1">
              {photoPosts.map((p) => (<img key={p.id} src={p.imageUrl} alt="" className="aspect-square w-full object-cover" />))}
            </div>
          )
        ) : (postsLoading || reelsLoading) ? (
          <div className="flex justify-center py-6" role="status" aria-label="Loading posts"><div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" /></div>
        ) : posts.length === 0 && reels.length === 0 ? (
          <p className="px-4 text-slate-500">No posts yet.</p>
        ) : (
          <div>
            {[...posts.map((p) => ({ kind: 'post' as const, item: p })), ...reels.map((r) => ({ kind: 'reel' as const, item: r }))]
              .sort((a, b) => Number(b.item.isPinned || false) - Number(a.item.isPinned || false) || new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime())
              .map((entry) => entry.kind === 'post' ? (
                <PostCard key={`post-${entry.item.id}`} post={entry.item} currentUser={currentUser}
                  onReactionChange={handleReactionChange} onToggleComments={handleToggleComments} onShare={setShareModalPost}
                  onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
              ) : (
                <div key={`reel-${entry.item.id}`} className="mx-4 mb-4"><FeedReelCard reel={entry.item} /></div>
              ))}
          </div>
        )}
      </div>
      )}

      {shareModalPost && <ShareModal postId={shareModalPost} onClose={() => setShareModalPost(null)} />}
      {shareProfileOpen && <ShareModal profileUsername={profile.username} profileId={profile.id} onClose={() => setShareProfileOpen(false)} />}

      {confirmBlock && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-5" onClick={() => setConfirmBlock(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-base font-semibold text-slate-900">Block {profile.displayName || profile.username}?</p>
            <p className="mb-4 text-sm leading-6 text-slate-600">They won't be able to message you or see your posts.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmBlock(false)} className="flex-1 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={() => { setConfirmBlock(false); handleBlockToggle(); }} className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Block</button>
            </div>
          </div>
        </div>
      )}

      {confirmUnfollow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-5" onClick={() => setConfirmUnfollow(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 text-base font-semibold text-slate-900">Unfollow @{profile.username}?</p>
            <p className="mb-4 text-sm leading-6 text-slate-600">You won't see their posts in your feed anymore.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmUnfollow(false)} className="flex-1 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={() => { setConfirmUnfollow(false); handleFollow(); }} className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Unfollow</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {openPost && (
        <CommentsModal
          post={openPost} currentUser={currentUser} comments={comments[openPost.id]}
          commentText={commentText} setCommentText={setCommentText}
          replyTo={replyTo} setReplyTo={setReplyTo}
          onAddComment={handleAddComment} onCommentsChanged={loadComments}
          onClose={() => setOpenComments(null)}
        />
      )}

      {viewHighlight && (
        <HighlightViewer highlight={viewHighlight} onClose={() => setViewHighlight(null)} />
      )}
      {viewHighlight && isMe && (
        <button
          onClick={() => handleDeleteHighlight(viewHighlight.id)}
          className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-lg"
        >
          Delete highlight
        </button>
      )}

      {createHlOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50" onClick={() => setCreateHlOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-base font-semibold text-slate-900">New Highlight</h3>
            <input
              value={hlTitle}
              onChange={(e) => setHlTitle(e.target.value)}
              maxLength={30}
              placeholder="Highlight title"
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
            <p className="mb-2 text-sm font-medium text-slate-700">Select stories</p>
            {myStatuses.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No active stories. Post a story first.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {myStatuses.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setHlSelected((prev) => prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id])}
                    className={`relative aspect-[9/16] overflow-hidden rounded-lg bg-slate-100 ${hlSelected.includes(s.id) ? 'ring-2 ring-slate-900' : ''}`}
                  >
                    {s.mediaUrl ? (
                      s.mediaType?.startsWith('video') ? (
                        <video src={s.mediaUrl} muted playsInline className="h-full w-full object-cover" />
                      ) : (
                        <img src={s.mediaUrl} alt="" className="h-full w-full object-cover" />
                      )
                    ) : (
                      <span className="flex h-full w-full items-center justify-center p-2 text-xs text-slate-600" style={{ background: s.bgColor || '#eee' }}>{s.textContent}</span>
                    )}
                    {hlSelected.includes(s.id) && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs text-white">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={handleCreateHighlight}
              disabled={hlSaving || !hlTitle.trim() || hlSelected.length === 0}
              className="mt-4 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {hlSaving ? 'Creating...' : `Create (${hlSelected.length} selected)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
