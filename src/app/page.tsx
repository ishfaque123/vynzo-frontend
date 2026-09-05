'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchFeed, toggleLike } from '@/lib/api/postApi';
import { fetchComments, addComment } from '@/lib/api/commentApi';
import ShareModal from '@/components/ShareModal';

function Avatar({ url, name, size = 8 }: { url?: string; name?: string; size?: number }) {
  const sizeClass = size === 8 ? 'h-8 w-8 text-xs' : 'h-6 w-6 text-[10px]';
  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center font-semibold text-slate-600`}
      style={url ? { backgroundImage: `url(${url})` } : {}}
    >
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}
function ShareArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="12" x2="18" y2="12" />
      <polyline points="12 6 18 12 12 18" />
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

function PostCard({ post, onLike, onToggleComments, onShare, isOpen, comments, commentText, setCommentText, onAddComment }: any) {
  return (
    <div className="rounded-lg border p-4">
      {post.originalPost && (
        <div className="mb-2 flex items-center gap-1 text-xs text-slate-500">
          <RepostIcon />
          <Link href={`/u/${post.author.username}`} className="font-medium hover:underline">
            {post.author.displayName}
          </Link>
          <span>reposted</span>
        </div>
      )}

      {!post.originalPost && (
        <div className="flex items-center gap-2">
          <Avatar url={post.author.profilePictureUrl} name={post.author.displayName} />
          <div className="leading-tight">
            <Link href={`/u/${post.author.username}`} className="block font-medium hover:underline">
              {post.author.displayName}
              {post.taggedUsers?.length > 0 && (
                <span className="font-normal text-slate-500">
                  {' '}with{' '}
                  {post.taggedUsers.map((t: any, i: number) => (
                    <span key={t.id} className="font-medium text-slate-700">
                      {t.displayName}{i < post.taggedUsers.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </span>
              )}
            </Link>
            <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      )}

      {post.content && <p className="mt-2 whitespace-pre-wrap">{post.content}</p>}
      {post.imageUrl && <img src={post.imageUrl} alt="" className="mt-2 w-full rounded-lg" />}

      {post.originalPost && (
        <div className="mt-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Avatar url={post.originalPost.author.profilePictureUrl} name={post.originalPost.author.displayName} />
            <div className="leading-tight">
              <Link href={`/u/${post.originalPost.author.username}`} className="block font-medium hover:underline">
                {post.originalPost.author.displayName}
              </Link>
              <span className="text-xs text-slate-400">{timeAgo(post.originalPost.createdAt)}</span>
            </div>
          </div>
          {post.originalPost.content && <p className="mt-2 whitespace-pre-wrap text-sm">{post.originalPost.content}</p>}
          {post.originalPost.imageUrl && <img src={post.originalPost.imageUrl} alt="" className="mt-2 w-full rounded-lg" />}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
            post.likedByMe ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <HeartIcon filled={post.likedByMe} />
          {post.likeCount > 0 ? post.likeCount : ''}
        </button>
        <button
          onClick={() => onToggleComments(post.id)}
          className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
        >
          <CommentIcon /> Comment
        </button>
        <button
          onClick={() => onShare(post.id)}
          className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
        >
          <ShareArrowIcon /> Share
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 border-t pt-3">
          {(comments || []).map((c: any) => (
            <div key={c.id} className="mb-2 flex items-start gap-2 text-sm">
              <Avatar url={c.author.profilePictureUrl} name={c.author.displayName} size={6} />
              <div>
                <span className="font-medium">{c.author.displayName}: </span>
                <span>{c.content}</span>
              </div>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-lg border px-3 py-1 text-sm"
            />
            <button
              onClick={() => onAddComment(post.id)}
              className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white"
            >
              Send
            </button>
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

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed()
        .then((result) => { if (result.success) setPosts(result.data.posts); })
        .finally(() => setFeedLoading(false));
    }
  }, [isAuthenticated]);

  async function handleLike(postId: string) {
    const result = await toggleLike(postId);
    if (result.success) {
      setPosts(posts.map((p) =>
        p.id === postId ? { ...p, likedByMe: result.data.liked, likeCount: result.data.likeCount } : p
      ));
    }
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
      <button
        onClick={() => router.push('/compose')}
        className="mb-6 flex w-full items-center gap-3 rounded-lg border p-3 text-left"
      >
        <Avatar url={user.profilePictureUrl} name={user.displayName} />
        <span className="flex-1 text-slate-400">What's on your mind?</span>
        <span className="rounded-full bg-slate-100 p-1.5 text-slate-600"><PlusIcon /></span>
      </button>

      {feedLoading ? (
        <p className="text-slate-500">Loading feed...</p>
      ) : posts.length === 0 ? (
        <p className="text-slate-500">No posts yet. Be the first to post!</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onToggleComments={handleToggleComments}
              onShare={setShareModalPost}
              isOpen={openComments === post.id}
              comments={comments[post.id]}
              commentText={commentText}
              setCommentText={setCommentText}
              onAddComment={handleAddComment}
            />
          ))}
        </div>
      )}

      {shareModalPost && (
        <ShareModal postId={shareModalPost} onClose={() => setShareModalPost(null)} />
      )}
    </div>
  );
}
