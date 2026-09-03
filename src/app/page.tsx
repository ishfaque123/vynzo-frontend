'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFeed, createPost } from '@/lib/api/postApi';

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);

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

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Welcome to Vynzo, {user.displayName}</h1>

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
              <p className="font-medium">{post.author.displayName}</p>
              <p className="mt-1 whitespace-pre-wrap">{post.content}</p>
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
