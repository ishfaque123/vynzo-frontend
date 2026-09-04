'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchFeed, createPost, toggleLike } from '@/lib/api/postApi';
import { fetchComments, addComment } from '@/lib/api/commentApi';

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
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    </svg>
  );
}

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed()
        .then((result) => {
          if (result.success) setPosts(result.data.posts);
        })
        .finally(() => setFeedLoading(false));
    }
  }, [isAuthenticated]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    const result = await createPost(content);
    setPosting(false);
    if (result.success) {
      setPosts([result.data.post, ...posts]);
      setContent('');
    }
  }

  async function handleLike(postId: string) {
    const result = await toggleLike(postId);
    if (result.success) {
      setPosts(posts.map((p) =>
        p.id === postId
          ? { ...p, likedByMe: result.data.liked, likeCount: result.data.likeCount }
          : p
      ));
    }
  }

  async function handleToggleComments(postId: string) {
    if (openComments === postId) {
      setOpenComments(null);
      return;
    }
    setOpenComments(postId);
    if (!comments[postId]) {
      const result = await fetchComments(postId);
      if (result.success) {
        setComments((prev) => ({ ...prev, [postId]: result.data.comments }));
      }
    }
  }

  async function handleAddComment(postId: string) {
    if (!commentText.trim()) return;
    const result = await addComment(postId, commentText);
    if (result.success) {
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), result.data.comment],
      }));
      setCommentText('');
    } else {
      alert(result.error.message);
    }
  }

  function handleShare(postId: string) {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    alert('Link copied!');
  }

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <form onSubmit={handlePost} className="mb-6 space-y-2 rounded-lg border p-3">
        <div className="flex gap-2">
          <Avatar url={user.profilePictureUrl} name={user.displayName} />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            maxLength={2000}
            className="w-full resize-none border-none px-0 py-1 outline-none"
            rows={2}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={posting || !content.trim()}
            className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {feedLoading ? (
        <p className="text-slate-500">Loading feed...</p>
      ) : posts.length === 0 ? (
        <p className="text-slate-500">No posts yet. Be the first to post!</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded-lg border p-4">
              <Link href={`/u/${post.author.username}`} className="flex items-center gap-2 font-medium hover:underline">
                <Avatar url={post.author.profilePictureUrl} name={post.author.displayName} />
                {post.author.displayName}
              </Link>
              <p className="mt-2 whitespace-pre-wrap">{post.content}</p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                    post.likedByMe ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <HeartIcon filled={post.likedByMe} />
                  {post.likeCount > 0 ? post.likeCount : ''}
                </button>
                <button
                  onClick={() => handleToggleComments(post.id)}
                  className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                >
                  <CommentIcon /> Comment
                </button>
                <button
                  onClick={() => handleShare(post.id)}
                  className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                >
                  <ShareIcon /> Share
                </button>
              </div>

              {openComments === post.id && (
                <div className="mt-3 border-t pt-3">
                  {(comments[post.id] || []).map((c) => (
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
                      onClick={() => handleAddComment(post.id)}
                      className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-2 text-xs text-slate-400">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
