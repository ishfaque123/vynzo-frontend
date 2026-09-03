'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchFeed, createPost, toggleLike } from '@/lib/api/postApi';
import { fetchComments, addComment } from '@/lib/api/commentApi';

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
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome to Vynzo, {user.displayName}</h1>
        <Link href="/settings" className="text-sm text-slate-500 underline">
          Edit Profile
        </Link>
      </div>

      <form onSubmit={handlePost} className="mb-8 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          maxLength={2000}
          className="w-full rounded-lg border px-4 py-2"
          rows={3}
        />
        <button
          type="submit"
          disabled={posting || !content.trim()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </form>

      {feedLoading ? (
        <p className="text-slate-500">Loading feed...</p>
      ) : posts.length === 0 ? (
        <p className="text-slate-500">No posts yet. Be the first to post!</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded-lg border p-4">
              <Link href={`/u/${post.author.username}`} className="font-medium hover:underline">
                {post.author.displayName}
              </Link>
              <p className="mt-1 whitespace-pre-wrap">{post.content}</p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    post.likedByMe ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {post.likedByMe ? '❤️ Liked' : '🤍 Like'} {post.likeCount > 0 ? `(${post.likeCount})` : ''}
                </button>
                <button
                  onClick={() => handleToggleComments(post.id)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                >
                  💬 Comment
                </button>
                <button
                  onClick={() => handleShare(post.id)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                >
                  🔗 Share
                </button>
              </div>

              {openComments === post.id && (
                <div className="mt-3 border-t pt-3">
                  {(comments[post.id] || []).map((c) => (
                    <div key={c.id} className="mb-2 text-sm">
                      <span className="font-medium">{c.author.displayName}: </span>
                      <span>{c.content}</span>
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
