'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFeed } from '@/lib/api/postApi';
import { fetchReelsConfig, fetchReelFeed } from '@/lib/api/reelApi';
import { getOfflineFeed, saveOfflineFeed } from '@/lib/offline/feedCache';
import { fetchComments, addComment } from '@/lib/api/commentApi';
import { playCommentSound } from '@/lib/sounds';
import ShareModal from '@/components/ShareModal';
import CommentsModal from '@/components/CommentsModal';
import PostCard from '@/components/PostCard';
import AdUnit from '@/components/AdUnit';
import { setPendingComposeImage } from '@/lib/pendingComposeImage';
import { setPendingReelVideo } from '@/lib/pendingReelVideo';
import StatusBar from '@/components/StatusBar';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import FeedReelCard from '@/components/FeedReelCard';
import PublicLanding from '@/components/PublicLanding';

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

export default function HomePage() {
  const { user, loading, isAuthenticated, offline } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedOffline, setFeedOffline] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [reelMaxDuration, setReelMaxDuration] = useState(180);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
  const [shareModalPost, setShareModalPost] = useState<string | null>(null);
  const commentsSeqRef = useRef<Record<string, number>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const reelInputRef = useRef<HTMLInputElement>(null);

  async function loadFeed() {
    if (!user?.id) return;
    setFeedError(false);

    // Cache-first startup: show the last successful feed immediately when
    // available. Network refresh happens afterwards, so reopening the app
    // does not force the user through a skeleton every time.
    let cachedPosts: any[] | null = null;
    try {
      const cached = await getOfflineFeed(user.id);
      if (cached?.posts?.length) {
        cachedPosts = cached.posts;
        setPosts(cached.posts);
        setHasMore(!!cached.hasMore);
        setOffset(cached.posts.length);
        setFeedOffline(false);
        setFeedLoading(false);
      } else if (posts.length === 0) {
        setFeedLoading(true);
      }
    } catch {
      if (posts.length === 0) setFeedLoading(true);
    }

    if (offline || feedOffline) {
      if (cachedPosts?.length) {
        setFeedOffline(true);
        setHasMore(false);
      } else if (posts.length === 0) {
        setFeedError(true);
      }
      setFeedLoading(false);
      return;
    }

    try {
      const [result, reelPage1, reelPage2, reelPage3] = await Promise.all([
        fetchFeed(0), fetchReelFeed(0), fetchReelFeed(10), fetchReelFeed(20),
      ]);
      if (result.success) {
        setPosts(result.data.posts);
        setHasMore(!!result.data.hasMore);
        setOffset(result.data.posts.length);
        setFeedOffline(false);
        await saveOfflineFeed(user.id, result.data.posts, !!result.data.hasMore);
      } else {
        setFeedError(true);
      }
      const reelPool = new Map<string, any>();
      for (const page of [reelPage1, reelPage2, reelPage3]) {
        if (page.success) for (const r of page.data.reels || []) reelPool.set(r.id, r);
      }
      const sortedReels = [...reelPool.values()].sort((a, b) => {
        const aFriend = a.friendStatus === 'friends' || a.friendStatus === 'following' ? 1 : 0;
        const bFriend = b.friendStatus === 'friends' || b.friendStatus === 'following' ? 1 : 0;
        if (aFriend !== bFriend) return bFriend - aFriend;
        return (b.likeCount || 0) - (a.likeCount || 0);
      });
      setReels(sortedReels);
    } catch {
      const cached = await getOfflineFeed(user.id);
      if (cached?.posts?.length) {
        setPosts(cached.posts);
        setHasMore(false);
        setOffset(cached.posts.length);
        setFeedOffline(true);
      } else {
        setFeedError(true);
      }
    } finally {
      setFeedLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) loadFeed();
  }, [isAuthenticated, offline]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void fetchReelsConfig().then((result) => {
      if (cancelled) return;
      const max = Number(result.success && result.data?.maxDurationSec);
      if (Number.isFinite(max) && max > 0) setReelMaxDuration(max);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleOnline = () => {
      setFeedOffline(false);
      if (isAuthenticated) loadFeed();
    };
    const handleOffline = () => setFeedOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated]);

  async function loadMore() {
    if (loadingMore || !hasMore || offline || feedOffline) return;
    setLoadingMore(true);
    try {
      const result = await fetchFeed(offset);
      if (result.success) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const fresh = result.data.posts.filter((p: any) => !existingIds.has(p.id));
          const nextPosts = [...prev, ...fresh];
          void saveOfflineFeed(user.id, nextPosts, !!result.data.hasMore);
          return nextPosts;
        });
        setHasMore(!!result.data.hasMore);
        setOffset((o) => o + result.data.posts.length);
      }
    } catch {
      const cached = await getOfflineFeed(user.id);
      if (cached?.posts?.length) {
        setPosts(cached.posts);
        setHasMore(false);
        setOffset(cached.posts.length);
        setFeedOffline(true);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [offset, hasMore, loadingMore]);

  function handleReactionChange(postId: string, reaction: string | null, count: number) {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const newCounts = { ...(p.reactionCounts || {}) };
      if (p.myReaction) {
        newCounts[p.myReaction] = Math.max(0, (newCounts[p.myReaction] || 0) - 1);
        if (newCounts[p.myReaction] === 0) delete newCounts[p.myReaction];
      }
      if (reaction) newCounts[reaction] = (newCounts[reaction] || 0) + 1;
      return { ...p, myReaction: reaction, likeCount: count, reactionCounts: newCounts };
    }));
  }
  function handlePostUpdated(postId: string, content: string, commentAudience: string) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, content, commentAudience } : p)));
  }
  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function loadComments(postId: string) {
    const seq = (commentsSeqRef.current[postId] || 0) + 1;
    commentsSeqRef.current[postId] = seq;
    const result = await fetchComments(postId);
    if (commentsSeqRef.current[postId] !== seq) return;
    if (result.success) setComments((prev) => ({ ...prev, [postId]: result.data.comments }));
  }

  async function handleToggleComments(postId: string) {
    setOpenComments(postId);
    setCommentText('');
    setReplyTo(null);
    if (!comments[postId]) await loadComments(postId);
  }

  async function handleAddComment(postId: string) {
    if (!commentText.trim()) return;
    const parentCommentId = replyTo?.postId === postId ? replyTo.commentId : undefined;
    const result = await addComment(postId, commentText, parentCommentId);
    if (result.success) {
      playCommentSound();
      await loadComments(postId);
      setCommentText('');
      setReplyTo(null);
      if (!parentCommentId) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p)));
      }
    } else {
      alert(result.error.message);
    }
  }

  // Inside the Android app's WebView, window.FrianzoNative is always
  // present (it's injected by the native side). A logged-out visitor there
  // is an existing app user, not a web SEO visitor, so send them straight
  // to the login form instead of the public marketing landing page.
  const isNativeApp = typeof window !== 'undefined' && !!(window as any).FrianzoNative;

  useEffect(() => {
    if (!loading && !user && isNativeApp) router.replace('/login');
  }, [loading, user, isNativeApp, router]);

  if (loading) return null;
  if (!user) return isNativeApp ? null : <PublicLanding />;

  const openPost = posts.find((p) => p.id === openComments);

  return (
    <div className="mx-auto w-full max-w-xl py-6 md:max-w-5xl app-fade-in">
      <div className="mb-3 flex w-full items-center gap-2 px-4">
        <Link href={`/u/${user.username}`}><Avatar url={user.profilePictureUrl} name={user.displayName} /></Link>
        <button onClick={() => { if (!feedOffline) router.push('/compose'); }} disabled={feedOffline} className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-left text-slate-400 shadow-sm">
          What's on your mind?
        </button>
        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { setPendingComposeImage(file); router.push('/compose'); }
          e.target.value = '';
        }} />
        <input ref={reelInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (!file.type.startsWith('video/')) return;
          const objectUrl = URL.createObjectURL(file);
          const probe = document.createElement('video');
          probe.preload = 'metadata';
          probe.onloadedmetadata = () => {
            const duration = probe.duration;
            URL.revokeObjectURL(objectUrl);
            probe.removeAttribute('src');
            probe.load();
            if (!Number.isFinite(duration) || duration <= 0) {
              alert('Could not read the video duration. Please choose another video.');
              return;
            }
            if (duration > reelMaxDuration) {
              alert(`Reels must be ${reelMaxDuration} seconds or shorter.`);
              return;
            }
            setPendingReelVideo(file, duration);
            setCreateMenuOpen(false);
            router.push('/reels/new');
          };
          probe.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            probe.removeAttribute('src');
            probe.load();
            alert('Could not read this video. Please choose another video.');
          };
          probe.src = objectUrl;
        }} />
        <div className="relative">
          <button onClick={() => { if (!feedOffline) setCreateMenuOpen((open) => !open); }} disabled={feedOffline} aria-label="Create post or reel" aria-expanded={createMenuOpen} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
            <PlusIcon />
          </button>
          {createMenuOpen && !feedOffline && (
            <div className="absolute right-0 top-11 z-50 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              <button type="button" onClick={() => { setCreateMenuOpen(false); galleryInputRef.current?.click(); }} className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
                Photo
              </button>
              <button type="button" onClick={() => { reelInputRef.current?.click(); }} className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
                Reel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4"><StatusBar user={user} offline={feedOffline} /></div>

      {feedLoading ? (
        <div className="flex flex-col gap-3 px-4" role="status" aria-label="Loading feed">
          <SkeletonPostCard /><SkeletonPostCard /><SkeletonPostCard />
        </div>
      ) : feedError ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <p className="text-sm text-red-500">Failed to load posts. Please try again.</p>
          <button onClick={loadFeed} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white">Retry</button>
        </div>
      ) : posts.length === 0 ? (
        <p className="px-4 text-slate-500">No posts yet. Be the first to post!</p>
      ) : (
        <>
          <div className="flex flex-col">
            {posts.map((post, index) => (
              <div key={post.id}>
                <PostCard post={post} currentUser={user}
                  onReactionChange={handleReactionChange} onToggleComments={handleToggleComments} onShare={setShareModalPost}
                  isOpen={false} comments={comments[post.id]}
                  commentText={commentText} setCommentText={setCommentText}
                  replyTo={replyTo} setReplyTo={setReplyTo}
                  onAddComment={handleAddComment} onCommentsChanged={loadComments}
                  onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} offline={feedOffline} />
                {(index + 1) % 5 === 0 && <div className="my-4 px-4"><AdUnit /></div>}
                {(index + 1) % 2 === 0 && reels.length > 0 && <div className="my-4 px-4"><FeedReelCard reel={reels[Math.floor(index / 2) % reels.length]} /></div>}
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="flex min-h-12 items-center justify-center px-4 py-4 text-sm text-slate-400">
            {loadingMore ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" role="status" aria-label="Loading more posts" /> : hasMore ? null : "You're all caught up"}
          </div>
        </>
      )}

      {shareModalPost && <ShareModal postId={shareModalPost} onClose={() => setShareModalPost(null)} />}

      {openPost && (
        <CommentsModal
          post={openPost} currentUser={user} comments={comments[openPost.id]}
          commentText={commentText} setCommentText={setCommentText}
          replyTo={replyTo} setReplyTo={setReplyTo}
          onAddComment={handleAddComment} onCommentsChanged={loadComments}
          onClose={() => setOpenComments(null)}
        />
      )}
    </div>
  );
}
