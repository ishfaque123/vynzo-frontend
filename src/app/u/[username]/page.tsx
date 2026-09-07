'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchUserProfile, fetchFollowCounts, fetchFollowStatus, toggleFollow } from '@/lib/api/userApi';
import { fetchUserPosts } from '@/lib/api/postApi';
import { fetchComments, addComment } from '@/lib/api/commentApi';
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

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'reels' | 'photos'>('all');
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
  const [shareModalPost, setShareModalPost] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile(username).then((result) => {
      if (result.success) {
        setProfile(result.data.user);
        fetchFollowCounts(result.data.user.id).then((c) => { if (c.success) setCounts(c.data); });
        fetchFollowStatus(result.data.user.id).then((s) => {
          if (s.success) setIsFollowing(s.data.status === 'following' || s.data.status === 'friends');
        });
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
      setIsFollowing(result.data.following);
      setCounts((prev) => ({ ...prev, followers: prev.followers + (result.data.following ? 1 : -1) }));
    }
  }

  function handleReactionChange(postId: string, reaction: string | null, count: number) {
    setPosts(posts.map((p) => {
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
    setPosts(posts.map((p) => (p.id === postId ? { ...p, content, commentAudience } : p)));
  }
  function handlePostDeleted(postId: string) {
    setPosts(posts.filter((p) => p.id !== postId));
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
      setPosts(posts.map((p) => (p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p)));
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
          {isMe && (
            <Link href="/settings-menu" aria-label="Settings" className="p-2 text-slate-900">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </Link>
          )}
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
        ) : (
          <button onClick={handleFollow} className={`mt-4 w-full rounded-lg py-2 font-medium ${isFollowing ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-white'}`}>
            {isFollowing ? 'Following' : 'Follow'}
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
