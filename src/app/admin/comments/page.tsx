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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load(targetPage: number = page) {
    setLoading(true);
    setError('');
    const result = await fetchAdminComments({ search, page: targetPage });
    if (result?.success) {
      setComments(result.data?.comments || []);
      setTotal(result.data?.pagination?.total || 0);
      setPage(result.data?.pagination?.page || targetPage);
    } else {
      setError(result?.error?.message || 'Could not load comments.');
    }
    setLoading(false);
  }

  useEffect(() => {
    load(1);
  }, []);

  function doSearch() {
    setPage(1);
    load(1);
  }

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
            if (event.key === 'Enter') doSearch();
          }}
          placeholder="Search comment, user, or post..."
          className="w-full max-w-md rounded-xl border px-4 py-2 text-sm outline-none"
        />
        <button onClick={doSearch} className="rounded-xl border px-4 py-2 text-sm font-medium">
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
                    title="Delete comment"
                    aria-label="Delete comment"
                    className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    {deleting === comment.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-4 w-4 animate-spin"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" className="opacity-75" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{total} comments</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => load(page - 1)} className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span>Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => load(page + 1)} className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
