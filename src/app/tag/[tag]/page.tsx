'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import FeedReelCard from '@/components/FeedReelCard';
import ShareModal from '@/components/ShareModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type FeedItem =
  | { kind: 'post'; at: number; data: any }
  | { kind: 'reel'; at: number; data: any };

export default function TagPage() {
  const params = useParams();
  const rawTag = params.tag as string;
  const tag = decodeURIComponent(rawTag || '').replace(/^#/, '');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/tags/${encodeURIComponent(tag)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const merged: FeedItem[] = [
            ...(res.data.posts || []).map((p: any) => ({
              kind: 'post' as const,
              at: new Date(p.createdAt).getTime(),
              data: p,
            })),
            ...(res.data.reels || []).map((r: any) => ({
              kind: 'reel' as const,
              at: new Date(r.createdAt).getTime(),
              data: r,
            })),
          ].sort((a, b) => b.at - a.at);
          setItems(merged);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`${API_URL}/api/users/me`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCurrentUser(res.data.user || res.data);
      })
      .catch(() => {});
  }, [tag]);

  function handleReactionChange(postId: string, reaction: string | null, count: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.kind === 'post' && it.data.id === postId
          ? { ...it, data: { ...it.data, myReaction: reaction, likeCount: count } }
          : it
      )
    );
  }

  function handleUpdated(postId: string, content: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.kind === 'post' && it.data.id === postId ? { ...it, data: { ...it.data, content } } : it
      )
    );
  }

  function handleDeleted(postId: string) {
    setItems((prev) => prev.filter((it) => !(it.kind === 'post' && it.data.id === postId)));
  }

  const sharePost = sharePostId
    ? items.find((it) => it.kind === 'post' && it.data.id === sharePostId)?.data
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
          #
        </div>
        <h1 className="text-2xl font-bold text-slate-900">#{tag}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {items.length} {items.length === 1 ? 'post' : 'posts'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-slate-800">No posts yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Be the first to post with #{tag}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Back to feed
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((it) =>
            it.kind === 'post' ? (
              <PostCard
                key={`post-${it.data.id}`}
                post={it.data}
                currentUser={currentUser}
                onReactionChange={handleReactionChange}
                onToggleComments={(postId: string) => {
                  window.location.href = `/post/${postId}`;
                }}
                onShare={(postId: string) => setSharePostId(postId)}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ) : (
              <FeedReelCard key={`reel-${it.data.id}`} reel={it.data} />
            )
          )}
        </div>
      )}

      {sharePostId && (
        <ShareModal
          postId={sharePostId}
          initialShareCode={sharePost?.shareCode ?? null}
          onClose={() => setSharePostId(null)}
        />
      )}
    </div>
  );
}
