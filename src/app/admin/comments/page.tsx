'use client';

import { useEffect, useState } from 'react';
import { deleteAdminComment, fetchAdminComments } from '@/lib/api/adminApi';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  parentCommentId: string | null;
  user: { id: string; username: string | null; displayName: string | null; profilePictureUrl: string | null };
  post: { id: string; content: string };
  _count: { replies: number; reactions: number; reports: number };
};

export default function Page() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const result = await fetchAdminComments({ search });
    if (result?.success) {
      setComments(result.data?.comments || []);
    } else {
      setError(result?.error?.message || 'Could not load comments.');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function removeComment(id: string) {
    if (!window.confirm('Delete this comment?')) return;
    setDeleting(id);
    const result = await deleteAdminComment(id);
    if (result?.success) {
      setComments((current) => current.filter((comment) => comment.id !== id));
    } else {
      setError(result?.error?.message || 'Could not delete comment.');
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Comments</h2>
        <p className="mt-1 text-sm text-slate-500">Review and manage comments across the platform.</p>
      </div>

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') load();
          }}
          placeholder="Search comment, user, or post..."
          className="w-full max-w-md rounded-xl border px-4 py-2 text-sm outline-none"
        />
        <button onClick={load} className="rounded-xl border px-4 py-2 text-sm font-medium">
          Search
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No comments found.</div>
        ) : (
          <div className="divide-y">
            {comments.map((comment) => (
              <div key={comment.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium">{comment.user.displayName || comment.user.username || 'Unknown user'}</div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.content}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Post: {comment.post.content || '(media post)'} · {comment._count.reactions} reactions · {comment._count.replies} replies · {comment._count.reports} reports
                    </p>
                  </div>
                  <button
                    onClick={() => removeComment(comment.id)}
                    disabled={deleting === comment.id}
                    className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 disabled:opacity-50"
                  >
                    {deleting === comment.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
