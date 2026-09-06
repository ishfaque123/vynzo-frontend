'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFeed } from '@/lib/api/postApi';
import { fetchComments, addComment } from '@/lib/api/commentApi';
import ShareModal from '@/components/ShareModal';
import PostCard from '@/components/PostCard';

function Avatar({ url, name }: { url?: string; name?: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center text-xs font-semibold text-slate-600" style={url ? { backgroundImage: `url(${url})` } : {}}>
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
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

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
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

  async function loadComments(postId: string) {
    const result = await fetchComments(postId);
    if (result.success) setComments((prev) => ({ ...prev, [postId]: result.data.comments }));
  }

  async function handleToggleComments(postId: string) {
    if (openComments === postId) { setOpenComments(null); return; }
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
            <PostCard key={post.id} post={post} currentUser={user}
              onReactionChange={handleReactionChange} onToggleComments={handleToggleComments} onShare={setShareModalPost}
              isOpen={openComments === post.id} comments={comments[post.id]}
              commentText={commentText} setCommentText={setCommentText}
              replyTo={replyTo} setReplyTo={setReplyTo}
              onAddComment={handleAddComment} onCommentsChanged={loadComments}
              onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
          ))}
        </div>
      )}

      {shareModalPost && <ShareModal postId={shareModalPost} onClose={() => setShareModalPost(null)} />}
    </div>
  );
}
