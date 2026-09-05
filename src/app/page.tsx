'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchFeed } from '@/lib/api/postApi';
import { fetchComments, addComment } from '@/lib/api/commentApi';
import ShareModal from '@/components/ShareModal';
import ReactionButton from '@/components/ReactionButton';
import PostMenu from '@/components/PostMenu';
import ShareArrowIcon from '@/components/icons/ShareArrow';

function Avatar({ url, name, size = 8 }: { url?: string; name?: string; size?: number }) {
  const sizeClass = size === 8 ? 'h-8 w-8 text-xs' : 'h-6 w-6 text-[10px]';
  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center font-semibold text-slate-600`} style={url ? { backgroundImage: `url(${url})` } : {}}>
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}
function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}
function RepostIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}
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

function PostCard({ post, currentUser, onReactionChange, onToggleComments, onShare, isOpen, comments, commentText, setCommentText, onAddComment, onUpdated, onDeleted }: any) {
  const isOwner = currentUser?.username === post.author.username;
  const [following, setFollowing] = useState(false);
  return (
    <div className="w-full border-y py-4">
      <div className="flex items-start justify-between">
        {post.originalPost ? (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <RepostIcon />
            <Link href={`/u/${post.author.username}`} className="font-medium hover:underline">{post.author.displayName}</Link>
            <span>reposted</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar url={post.author.profilePictureUrl} name={post.author.displayName} />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <Link href={`/u/${post.author.username}`} className="font-medium hover:underline">
                  {post.author.displayName}
                </Link>
                {!isOwner && !following && (
                  <button onClick={() => setFollowing(true)} className="text-xs font-semibold text-blue-600">Follow</button>
                )}
              </div>
              {post.taggedUsers?.length > 0 && (
                <span className="block text-xs text-slate-500">
                  with{' '}
                  {post.taggedUsers.map((t: any, i: number) => (
                    <span key={t.id} className="font-medium text-slate-700">{t.displayName}{i < post.taggedUsers.length - 1 ? ', ' : ''}</span>
                  ))}
                </span>
              )}
              <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        )}
        <PostMenu
          postId={post.id}
          isOwner={isOwner}
          content={post.content}
          commentAudience={post.commentAudience}
          onUpdated={(content: string, commentAudience: string) => onUpdated(post.id, content, commentAudience)}
          onDeleted={() => onDeleted(post.id)}
        />
      </div>

      {post.content && <p className="mt-2 whitespace-pre-wrap">{post.content}</p>}
      {post.imageUrl && <img src={post.imageUrl} alt="" className="mt-2 w-full rounded-lg" />}

      {post.originalPost && (
        <div className="mt-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Avatar url={post.originalPost.author.profilePictureUrl} name={post.originalPost.author.displayName} />
            <div className="leading-tight">
              <Link href={`/u/${post.originalPost.author.username}`} className="block font-medium hover:underline">{post.originalPost.author.displayName}</Link>
              <span className="text-xs text-slate-400">{timeAgo(post.originalPost.createdAt)}</span>
            </div>
          </div>
          {post.originalPost.content && <p className="mt-2 whitespace-pre-wrap text-sm">{post.originalPost.content}</p>}
          {post.originalPost.imageUrl && <img src={post.originalPost.imageUrl} alt="" className="mt-2 w-full rounded-lg" />}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4">
        <ReactionButton postId={post.id} myReaction={post.myReaction} likeCount={post.likeCount} onChange={(reaction: string | null, count: number) => onReactionChange(post.id, reaction, count)} />
        <button onClick={() => onToggleComments(post.id)} className="flex items-center gap-1 text-slate-600">
          <CommentIcon />
          {post.commentCount > 0 ? <span className="text-xs">{post.commentCount}</span> : null}
        </button>
        <button onClick={() => onShare(post.id)} className="flex items-center gap-1 text-slate-600">
          <ShareArrowIcon />
          {post.shareCount > 0 ? <span className="text-xs">{post.shareCount}</span> : null}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 border-t pt-3">
          {(comments || []).map((c: any) => (
            <div key={c.id} className="mb-2 flex items-start gap-2 text-sm">
              <Avatar url={c.author.profilePictureUrl} name={c.author.displayName} size={6} />
              <div><span className="font-medium">{c.author.displayName}: </span><span>{c.content}</span></div>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1 rounded-lg border px-3 py-1 text-sm" />
            <button onClick={() => onAddComment(post.id)} className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [shareModalPost, setShareModalPost] = useState<string | null>(null);

  useEffect(() => { if (!loading && !isAuthenticated) router.push('/login'); }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed().then((result) => { if (result.success) setPosts(result.data.posts); }).finally(() => setFeedLoading(false));
    }
  }, [isAuthenticated]);

  function handleReactionChange(postId: string, reaction: string | null, count: number) {
    setPosts(posts.map((p) => (p.id === postId ? { ...p, myReaction: reaction, likeCount: count } : p)));
  }
  function handlePostUpdated(postId: string, content: string, commentAudience: string) {
    setPosts(posts.map((p) => (p.id === postId ? { ...p, content, commentAudience } : p)));
  }
  function handlePostDeleted(postId: string) {
    setPosts(posts.filter((p) => p.id !== postId));
  }

  async function handleToggleComments(postId: string) {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId);
    if (!comments[postId]) {
      const result = await fetchComments(postId);
      if (result.success) setComments((prev) => ({ ...prev, [postId]: result.data.comments }));
    }
  }

  async function handleAddComment(postId: string) {
    if (!commentText.trim()) return;
    const result = await addComment(postId, commentText);
    if (result.success) {
      playSubmitSound();
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), result.data.comment] }));
      setCommentText('');
    } else {
      alert(result.error.message);
    }
  }

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <button onClick={() => router.push('/compose')} className="mb-6 flex w-full items-center gap-3 rounded-lg border p-3 text-left">
        <Avatar url={user.profilePictureUrl} name={user.displayName} />
        <span className="flex-1 text-slate-400">What's on your mind?</span>
        <span className="rounded-full bg-slate-100 p-1.5 text-slate-600"><PlusIcon /></span>
      </button>

      {feedLoading ? (
        <p className="text-slate-500">Loading feed...</p>
      ) : posts.length === 0 ? (
        <p className="text-slate-500">No posts yet. Be the first to post!</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onReactionChange={handleReactionChange}
              onToggleComments={handleToggleComments}
              onShare={setShareModalPost}
              isOpen={openComments === post.id}
              comments={comments[post.id]}
              commentText={commentText}
              setCommentText={setCommentText}
              onAddComment={handleAddComment}
              onUpdated={handlePostUpdated}
              onDeleted={handlePostDeleted}
            />
          ))}
        </div>
      )}

      {shareModalPost && <ShareModal postId={shareModalPost} onClose={() => setShareModalPost(null)} />}
    </div>
  );
}
