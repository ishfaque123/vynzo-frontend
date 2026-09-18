'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  deleteAdminComment,
  deleteAdminPost,
  deleteAdminReel,
  fetchAdminOverview,
  fetchAdminPosts,
  fetchAdminReports,
  fetchAdminUsers,
  updateAdminUserStatus,
} from '@/lib/api/adminApi';

type Tab = 'overview' | 'users' | 'posts' | 'reports';

function formatDate(value: string | null | undefined) {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function StatCard({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'suspended'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-red-50 text-red-700';
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{status}</span>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [postTotal, setPostTotal] = useState(0);
  const [postPage, setPostPage] = useState(1);
  const [postSearch, setPostSearch] = useState('');
  const [reports, setReports] = useState<any>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    const result = await fetchAdminOverview();
    if (!result.success) {
      if (result.error?.code === 'ADMIN_ACCESS_REQUIRED' || result.error?.code === 'NOT_AUTHENTICATED') {
        router.replace('/login');
        return;
      }
      throw new Error(result.error?.message || 'Unable to load dashboard.');
    }
    setOverview(result.data);
  }, [router]);

  const loadUsers = useCallback(async () => {
    const result = await fetchAdminUsers({ page: userPage, search: userSearch, status: userStatus });
    if (!result.success) throw new Error(result.error?.message || 'Unable to load users.');
    setUsers(result.data.users);
    setUserTotal(result.data.pagination.total);
  }, [userPage, userSearch, userStatus]);

  const loadPosts = useCallback(async () => {
    const result = await fetchAdminPosts({ page: postPage, search: postSearch });
    if (!result.success) throw new Error(result.error?.message || 'Unable to load posts.');
    setPosts(result.data.posts);
    setPostTotal(result.data.pagination.total);
  }, [postPage, postSearch]);

  const loadReports = useCallback(async () => {
    const result = await fetchAdminReports();
    if (!result.success) throw new Error(result.error?.message || 'Unable to load reports.');
    setReports(result.data);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadOverview()
      .catch((err) => setError(err.message || 'Unable to load dashboard.'))
      .finally(() => setLoading(false));
  }, [loadOverview]);

  useEffect(() => {
    if (tab !== 'users') return;
    loadUsers().catch((err) => setError(err.message || 'Unable to load users.'));
  }, [tab, loadUsers]);

  useEffect(() => {
    if (tab !== 'posts') return;
    loadPosts().catch((err) => setError(err.message || 'Unable to load posts.'));
  }, [tab, loadPosts]);

  useEffect(() => {
    if (tab !== 'reports') return;
    loadReports().catch((err) => setError(err.message || 'Unable to load reports.'));
  }, [tab, loadReports]);

  const reportItems = useMemo(() => {
    if (!reports) return [];
    return [
      ...(reports.postReports || []).map((x: any) => ({ ...x, type: 'Post', target: x.post?.content || 'Post' })),
      ...(reports.userReports || []).map((x: any) => ({ ...x, type: 'User', target: x.reported?.username ? `@${x.reported.username}` : 'User' })),
      ...(reports.commentReports || []).map((x: any) => ({ ...x, type: 'Comment', target: x.comment?.content || 'Comment' })),
      ...(reports.reelCommentReports || []).map((x: any) => ({ ...x, type: 'Reel comment', target: x.comment?.content || 'Comment' })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports]);

  async function changeUserStatus(userId: string, status: 'active' | 'suspended' | 'deactivated') {
    setActionId(userId);
    const result = await updateAdminUserStatus(userId, status);
    setActionId(null);
    if (!result.success) return setError(result.error?.message || 'Action failed.');
    setUsers((current) => current.map((u) => u.id === userId ? { ...u, accountStatus: status } : u));
  }

  async function removePost(postId: string) {
    if (!window.confirm('Delete this post permanently?')) return;
    setActionId(postId);
    const result = await deleteAdminPost(postId);
    setActionId(null);
    if (!result.success) return setError(result.error?.message || 'Action failed.');
    setPosts((current) => current.filter((p) => p.id !== postId));
    setPostTotal((n) => Math.max(0, n - 1));
  }

  async function removeComment(commentId: string) {
    if (!window.confirm('Delete this comment permanently?')) return;
    setActionId(commentId);
    const result = await deleteAdminComment(commentId);
    setActionId(null);
    if (!result.success) return setError(result.error?.message || 'Action failed.');
    setReports((current: any) => current ? {
      ...current,
      commentReports: (current.commentReports || []).filter((x: any) => x.comment?.id !== commentId),
      reelCommentReports: (current.reelCommentReports || []).filter((x: any) => x.comment?.id !== commentId),
    } : current);
  }

  async function removeReel(reelId: string) {
    if (!window.confirm('Delete this reel permanently?')) return;
    setActionId(reelId);
    const result = await deleteAdminReel(reelId);
    setActionId(null);
    if (!result.success) return setError(result.error?.message || 'Action failed.');
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100"><div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" /></div>;
  }

  if (error && !overview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white">Retry</button>
        </div>
      </div>
    );
  }

  const counts = overview?.counts || {};

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:p-6">
        <header className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Frianzo</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500">Manage users, content, reports and platform activity.</p>
            </div>
            <button onClick={() => router.push('/')} className="rounded-full border px-4 py-2 text-sm font-medium text-slate-700">Back to app</button>
          </div>
        </header>

        <nav className="grid grid-cols-2 gap-2 rounded-2xl border bg-white p-2 md:grid-cols-4">
          {([
            ['overview', 'Overview'],
            ['users', 'Users'],
            ['posts', 'Posts'],
            ['reports', `Reports ${counts.totalReports ? `(${counts.totalReports})` : ''}`],
          ] as [Tab, string][]).map(([value, label]) => (
            <button key={value} onClick={() => { setTab(value); setError(''); }} className={`rounded-xl px-3 py-2.5 text-sm font-medium ${tab === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
            </button>
          ))}
        </nav>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {tab === 'overview' && (
          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total users" value={counts.totalUsers || 0} detail={`${counts.activeUsers || 0} active`} />
              <StatCard label="Posts" value={counts.totalPosts || 0} detail={`${counts.postReports || 0} post reports`} />
              <StatCard label="Comments" value={counts.totalComments || 0} detail={`${counts.commentReports || 0} comment reports`} />
              <StatCard label="Reels" value={counts.totalReels || 0} detail={`${counts.reelCommentReports || 0} reel-comment reports`} />
              <StatCard label="Suspended" value={counts.suspendedUsers || 0} />
              <StatCard label="Deactivated" value={counts.deactivatedUsers || 0} />
              <StatCard label="User reports" value={counts.userReports || 0} />
              <StatCard label="All reports" value={counts.totalReports || 0} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">Recent users</h2>
                  <button onClick={() => setTab('users')} className="text-sm text-slate-500">View all</button>
                </div>
                <div className="divide-y">
                  {(overview?.recentUsers || []).map((u: any) => (
                    <div key={u.id} className="flex items-center gap-3 py-3">
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-200">
                        {u.profilePictureUrl && <img src={u.profilePictureUrl} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{u.displayName || u.username || 'User'}</p>
                        <p className="truncate text-xs text-slate-500">{u.email || 'No email'}</p>
                      </div>
                      <StatusBadge status={u.accountStatus} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">Recent post reports</h2>
                  <button onClick={() => setTab('reports')} className="text-sm text-slate-500">View all</button>
                </div>
                <div className="divide-y">
                  {(overview?.recentReports || []).map((r: any) => (
                    <div key={r.id} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{r.reason}</p>
                        <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{r.post?.content || 'Reported post'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'users' && (
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 md:flex-row">
              <input value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} placeholder="Search username, name or email" className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:border-slate-500" />
              <select value={userStatus} onChange={(e) => { setUserStatus(e.target.value); setUserPage(1); }} className="rounded-xl border px-3 py-2 text-sm">
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead><tr className="border-b text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3">User</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Activity</th><th className="px-3 py-3">Actions</th></tr></thead>
                <tbody className="divide-y">
                  {users.map((u: any) => (
                    <tr key={u.id}>
                      <td className="px-3 py-3"><p className="font-medium">{u.displayName || u.username || 'User'}</p><p className="text-xs text-slate-500">{u.username ? `@${u.username}` : u.id}</p></td>
                      <td className="px-3 py-3 text-slate-600">{u.email || '—'}</td>
                      <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{u.role}</span></td>
                      <td className="px-3 py-3"><StatusBadge status={u.accountStatus} /></td>
                      <td className="px-3 py-3 text-xs text-slate-500">{u._count.posts} posts · {u._count.comments} comments<br />Last: {formatDate(u.lastActiveAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {u.accountStatus !== 'active' && <button disabled={actionId === u.id} onClick={() => changeUserStatus(u.id, 'active')} className="rounded-lg border px-2 py-1 text-xs">Activate</button>}
                          {u.accountStatus !== 'suspended' && <button disabled={actionId === u.id} onClick={() => changeUserStatus(u.id, 'suspended')} className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700">Suspend</button>}
                          {u.accountStatus !== 'deactivated' && <button disabled={actionId === u.id} onClick={() => changeUserStatus(u.id, 'deactivated')} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700">Deactivate</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No users found.</p>}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-slate-500">
              <span>{userTotal} users</span>
              <div className="flex gap-2">
                <button disabled={userPage <= 1} onClick={() => setUserPage((p) => p - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button>
                <span className="px-2 py-1.5">Page {userPage}</span>
                <button disabled={userPage * 20 >= userTotal} onClick={() => setUserPage((p) => p + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          </section>
        )}

        {tab === 'posts' && (
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-4 flex gap-2">
              <input value={postSearch} onChange={(e) => { setPostSearch(e.target.value); setPostPage(1); }} placeholder="Search post content or author" className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:border-slate-500" />
            </div>
            <div className="space-y-3">
              {posts.map((p: any) => (
                <article key={p.id} className="rounded-xl border p-4">
                  <div className="flex gap-3">
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-200">
                      {p.user?.profilePictureUrl && <img src={p.user.profilePictureUrl} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="text-sm font-semibold">{p.user?.displayName || p.user?.username || 'User'}</p><p className="text-xs text-slate-500">@{p.user?.username || 'unknown'} · {formatDate(p.createdAt)}</p></div>
                        <button disabled={actionId === p.id} onClick={() => removePost(p.id)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700">Delete</button>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{p.content}</p>
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="mt-3 max-h-72 rounded-xl object-cover" />}
                      <div className="mt-3 text-xs text-slate-500">{p._count.likes} reactions · {p._count.comments} comments · {p._count.reports} reports · {p._count.reposts} reposts</div>
                    </div>
                  </div>
                </article>
              ))}
              {posts.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No posts found.</p>}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-slate-500">
              <span>{postTotal} posts</span>
              <div className="flex gap-2">
                <button disabled={postPage <= 1} onClick={() => setPostPage((p) => p - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button>
                <span className="px-2 py-1.5">Page {postPage}</span>
                <button disabled={postPage * 20 >= postTotal} onClick={() => setPostPage((p) => p + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          </section>
        )}

        {tab === 'reports' && (
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-4"><h2 className="font-semibold">Moderation reports</h2><p className="text-xs text-slate-500">Review reports from posts, users, comments and reel comments.</p></div>
            <div className="space-y-3">
              {reportItems.map((r: any) => (
                <div key={`${r.type}-${r.id}`} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{r.type}</span><span className="text-sm font-semibold">{r.reason}</span></div>
                    <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{r.target}</p>
                  {r.details && <p className="mt-1 text-xs text-slate-500">{r.details}</p>}
                  <p className="mt-2 text-xs text-slate-400">Reported by @{r.reporter?.username || 'unknown'}</p>
                  {r.type === 'Comment' && r.comment?.id && <button disabled={actionId === r.comment.id} onClick={() => removeComment(r.comment.id)} className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">Delete comment</button>}
                </div>
              ))}
              {reportItems.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No reports found.</p>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
