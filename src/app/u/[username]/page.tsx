'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchUserProfile, fetchFollowCounts, fetchFollowStatus, toggleFollow, blockUser, unblockUser } from '@/lib/api/userApi';
import { fetchUserPosts } from '@/lib/api/postApi';
import { fetchComments, addComment } from '@/lib/api/commentApi';
import { createConversation } from '@/lib/api/messageApi';
import ShareModal from '@/components/ShareModal';
import CommentsModal from '@/components/CommentsModal';
import PostCard from '@/components/PostCard';

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
function BlockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
    </svg>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
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

  useEffect(() => {
    fetchUserProfile(username).then((result) => {
      if (result.success) {
        setProfile(result.data.user);
        setBlockedByMe(!!result.data.user.blockedByMe);
        setBlockedByOther(!!result.data.user.blockedByOther);
        fetchFollowCounts(result.data.user.id).then((c) => { if (c.success) setCounts(c.data); });
        setFriendStatus(result.data.user.friendStatus || 'none');
      }
      setLoading(false);
    });
    fetchUserPosts(username).then((result) => {
      if (result.success) setPosts(result.data.posts);
      setPostsLoading(false);
    });
  }, [username]);

  async function handleFollow() {
    if (!profile) return;
    const result = await toggleFollow(profile.id);
    if (result.success) {
      if (result.data.following) {
        setFriendStatus((prev) => (prev === 'follow_back' ? 'friends' : 'following'));
      } else {
        setFriendStatus('none');
      }
      setCounts((prev) => ({ ...prev, followers: prev.followers + (result.data.following ? 1 : -1) }));
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
        alert(result.error?.message || 'Could not start conversation.');
      }
    } catch {
      alert('Could not start conversation. Please try again.');
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
        if (!confirm(`Block ${profile.displayName || profile.username}? They won't be able to message you or see your posts.`)) {
          setBlockBusy(false);
          return;
        }
        const result = await blockUser(profile.id);
        if (result.success) {
          setBlockedByMe(true);
          setFriendStatus('none');
        }
      }
    } catch {
      alert('Could not update block status. Please try again.');
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
  function handlePostUpdated(postId: string, content: string, commentAudience: string) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, content, commentAudience } : p)));
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
      alert(result.error.message);
    }
  }

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;
  if (!profile) return <p className="p-8 text-center text-slate-500">User not found.</p>;

  const isMe = currentUser?.username === profile.username;
  const photoPosts = posts.filter((p) => p.imageUrl);
  const openPost = posts.find((p) => p.id === openComments);

  return (
    <div className="mx-auto max-w-xl pb-6">
      <div className="h-32 bg-slate-200 bg-cover bg-center" style={profile.coverPhotoUrl ? { backgroundImage: `url(${profile.coverPhotoUrl})` } : {}} />

      <div className="px-4">
        <div className="-mt-10 mb-2 flex items-end justify-between">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-200 bg-cover bg-center" style={profile.profilePictureUrl ? { backgroundImage: `url(${profile.profilePictureUrl})` } : {}}>
            {!profile.profilePictureUrl && (
              <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-600">{profile.displayName?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <div className="flex items-center">
            {!isMe && (
              <div className="relative">
                <button onClick={() => setMoreOpen(!moreOpen)} aria-label="More options" className="p-2 text-slate-600">
                  <MoreIcon />
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg" onMouseLeave={() => setMoreOpen(false)}>
                    <button disabled={blockBusy} onClick={handleBlockToggle} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50 disabled:opacity-50">
                      <BlockIcon /> {blockedByMe ? 'Unblock' : 'Block'}
                    </button>
                  </div>
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
          </div>
        </div>

        <h1 className="text-xl font-semibold">{profile.displayName}</h1>
        <p className="text-slate-500">@{profile.username}</p>
        {profile.bio && <p className="mt-2 text-slate-700">{profile.bio}</p>}
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm text-blue-600 hover:underline">{profile.website}</a>
        )}
        {(profile.city || profile.province) && (
          <p className="mt-1 text-sm text-slate-500">{[profile.city, profile.province].filter(Boolean).join(', ')}</p>
        )}

        <div className="mt-4 flex gap-6 border-y py-3 text-sm">
          <span><b>{posts.length}</b> <span className="text-slate-500">Posts</span></span>
          <span><b>{counts.followers}</b> <span className="text-slate-500">Followers</span></span>
          <span><b>{counts.following}</b> <span className="text-slate-500">Following</span></span>
        </div>

        {isMe ? (
          <Link href="/settings-menu/dashboard" className="mt-4 block rounded-lg border py-2 text-center font-medium text-slate-700">Dashboard</Link>
        ) : blockedByOther ? (
          <p className="mt-4 rounded-lg bg-slate-100 py-2.5 text-center text-sm text-slate-500">This user is unavailable.</p>
        ) : blockedByMe ? (
          <button onClick={handleBlockToggle} disabled={blockBusy} className="mt-4 w-full rounded-lg border py-2 font-medium text-slate-700 disabled:opacity-50">
            Unblock
          </button>
        ) : friendStatus === 'friends' ? (
          <button onClick={handleFollow} className="mt-4 w-full rounded-lg bg-slate-100 py-2 font-medium text-slate-700">
            • Friends
          </button>
        ) : (
          <button onClick={handleFollow} className={`mt-4 w-full rounded-lg py-2 font-medium ${friendStatus === 'following' ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-white'}`}>
            {friendStatus === 'following' ? 'Following' : friendStatus === 'follow_back' ? 'Follow Back' : 'Follow'}
          </button>
        )}
      </div>

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

      <div className="mt-2">
        {activeTab === 'reels' ? (
          <p className="px-4 py-8 text-center text-slate-500">No reels yet.</p>
        ) : activeTab === 'photos' ? (
          photoPosts.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1 px-1">
              {photoPosts.map((p) => (<img key={p.id} src={p.imageUrl} alt="" className="aspect-square w-full object-cover" />))}
            </div>
          )
        ) : postsLoading ? (
          <p className="px-4 text-slate-500">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="px-4 text-slate-500">No posts yet.</p>
        ) : (
          <div className="px-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUser={currentUser}
                onReactionChange={handleReactionChange} onToggleComments={handleToggleComments} onShare={setShareModalPost}
                onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
            ))}
          </div>
        )}
      </div>

      {shareModalPost && <ShareModal postId={shareModalPost} onClose={() => setShareModalPost(null)} />}
      {shareProfileOpen && <ShareModal profileUsername={profile.username} profileId={profile.id} onClose={() => setShareProfileOpen(false)} />}

      {openPost && (
        <CommentsModal
          post={openPost} currentUser={currentUser} comments={comments[openPost.id]}
          commentText={commentText} setCommentText={setCommentText}
          replyTo={replyTo} setReplyTo={setReplyTo}
          onAddComment={handleAddComment} onCommentsChanged={loadComments}
          onClose={() => setOpenComments(null)}
        />
      )}
    </div>
  );
}
