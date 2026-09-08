'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchComments, addComment } from '@/lib/api/commentApi';
import ShareModal from '@/components/ShareModal';
import CommentsModal from '@/components/CommentsModal';
import PostCard from '@/components/PostCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

export default function PostDetailPage() {
  const params = useParams();
  const { user: currentUser } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/posts/${params.id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((result) => { if (result.success) setPost(result.data.post); })
      .finally(() => setLoading(false));
  }, [params.id]);

  function handleReactionChange(postId: string, reaction: string | null, count: number) {
    setPost((p: any) => {
      const newCounts = { ...(p.reactionCounts || {}) };
      if (p.myReaction) {
        newCounts[p.myReaction] = Math.max(0, (newCounts[p.myReaction] || 0) - 1);
        if (newCounts[p.myReaction] === 0) delete newCounts[p.myReaction];
      }
      if (reaction) newCounts[reaction] = (newCounts[reaction] || 0) + 1;
      return { ...p, myReaction: reaction, likeCount: count, reactionCounts: newCounts };
    });
  }
  function handlePostUpdated(_postId: string, content: string, commentAudience: string) {
    setPost((p: any) => ({ ...p, content, commentAudience }));
  }
  function handlePostDeleted() {
    setPost(null);
  }

  async function loadComments() {
    const result = await fetchComments(post.id);
    if (result.success) setComments(result.data.comments);
  }
  async function handleToggleComments() {
    setOpenComments(true);
    if (comments.length === 0) await loadComments();
  }
  async function handleAddComment() {
    if (!commentText.trim()) return;
    const result = await addComment(post.id, commentText, replyTo?.postId === post.id ? replyTo.commentId : undefined);
    if (result.success) {
      playSubmitSound();
      await loadComments();
      setCommentText('');
      setReplyTo(null);
      setPost((p: any) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
    } else {
      alert(result.error.message);
    }
  }

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;
  if (!post) return <p className="p-8 text-center text-slate-500">Post not found.</p>;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <PostCard
        post={post}
        currentUser={currentUser}
        onReactionChange={handleReactionChange}
        onToggleComments={handleToggleComments}
        onShare={() => setShareOpen(true)}
        onUpdated={handlePostUpdated}
        onDeleted={handlePostDeleted}
      />

      {shareOpen && <ShareModal postId={post.id} onClose={() => setShareOpen(false)} />}

      {openComments && (
        <CommentsModal
          post={post} currentUser={currentUser} comments={comments}
          commentText={commentText} setCommentText={setCommentText}
          replyTo={replyTo} setReplyTo={setReplyTo}
          onAddComment={handleAddComment} onCommentsChanged={loadComments}
          onClose={() => setOpenComments(false)}
        />
      )}
    </div>
  );
}
