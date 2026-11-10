'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFeed, fetchContentMix } from '@/lib/api/postApi';
import { fetchReelsConfig, fetchReelFeed } from '@/lib/api/reelApi';
import { getOfflineFeed, saveOfflineFeed } from '@/lib/offline/feedCache';
import { fetchComments, addComment } from '@/lib/api/commentApi';
import { playCommentSound } from '@/lib/sounds';
import ShareModal from '@/components/ShareModal';
import CommentsModal from '@/components/CommentsModal';
import PostCard from '@/components/PostCard';
import AdUnit from '@/components/AdUnit';
import { AdsterraBanner } from '@/components/Adsterra';
import { setPendingComposeImage } from '@/lib/pendingComposeImage';
import { takePendingNewPost } from '@/lib/pendingNewPost';
import { setPendingReelVideo } from '@/lib/pendingReelVideo';
import StatusBar from '@/components/StatusBar';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import FeedReelCard from '@/components/FeedReelCard';
import PublicLanding from '@/components/PublicLanding';
import Avatar from '@/components/Avatar';

function RefreshIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
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
  // Adaptive feed mix: how often reels are injected among posts, based on the
  // user's actual consumption (reelRatio 0..1 from /api/posts/content-mix).
  const [reelEvery, setReelEvery] = useState(2);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedOffline, setFeedOffline] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [autoRetrying, setAutoRetrying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const autoRetryCountRef = useRef(0);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
  const [shareModalPost, setShareModalPost] = useState<string | null>(null);
  const commentsSeqRef = useRef<Record<string, number>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // FB-style background auto-retry for a failed first load: up to 3 further
  // attempts (3s, 8s, 15s backoff). Manual Retry resets the counter.
  // Cached posts are never cleared by a failure, so retries run behind them.
  function scheduleAutoRetry() {
    if (autoRetryCountRef.current >= 3) return;
    const delays = [3000, 8000, 15000];
    const delay = delays[autoRetryCountRef.current];
    autoRetryCountRef.current += 1;
    setAutoRetrying(true);
    if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
    autoRetryTimerRef.current = setTimeout(() => {
      setAutoRetrying(false);
      void loadFeed(true);
    }, delay);
  }
  useEffect(() => {
    return () => {
      if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
    };
  }, []);

  async function loadFeed(isAutoRetry = false) {
    // Optimistically prepend just-created post (Facebook/Instagram behavior)
    const pendingPost = takePendingNewPost();
    if (pendingPost) {
      setPosts((prev: any[]) => {
        if (prev.some((p: any) => p.id === pendingPost.id)) return prev;
        return [pendingPost, ...prev];
      });
    }
    if (!user?.id) return;
    if (!isAutoRetry) {
      autoRetryCountRef.current = 0;
      setAutoRetrying(false);
      if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
    }
    setFeedError(false);
    setLoadMoreError(false);

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

    if ((offline || feedOffline) && !navigator.onLine) {
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
      const [result, reelPage1, mixRes] = await Promise.all([
        fetchFeed(0), fetchReelFeed(0), fetchContentMix().catch(() => null),
      ]);
      if (mixRes?.success && typeof mixRes.data?.reelRatio === 'number') {
        const r = mixRes.data.reelRatio;
        // User-ordered 2026-10-17: MORE reels in feed.
        // Heavy reel watcher -> reel after every post; even low -> every 3.
        setReelEvery(r >= 0.6 ? 1 : r >= 0.3 ? 2 : 3);
      }
      if (result.success) {
        autoRetryCountRef.current = 0;
        setAutoRetrying(false);
        setPosts(result.data.posts);
        setHasMore(!!result.data.hasMore);
        setOffset(result.data.posts.length);
        setFeedOffline(false);
        await saveOfflineFeed(user.id, result.data.posts, !!result.data.hasMore);
      } else {
        setFeedError(true);
        scheduleAutoRetry();
      }
      const reelPool = new Map<string, any>();
      for (const page of [reelPage1]) {
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
      // Only a genuinely offline device falls back to the cached feed.
      // A request error while online is a normal load error (the existing
      // error/Retry state), never the end of the feed.
      const cached = !navigator.onLine ? await getOfflineFeed(user.id) : null;
      if (cached?.posts?.length) {
        setPosts(cached.posts);
        setHasMore(false);
        setOffset(cached.posts.length);
        setFeedOffline(true);
      } else {
        setFeedError(true);
        scheduleAutoRetry();
      }
    } finally {
      setFeedLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) loadFeed();
  }, [isAuthenticated, offline]);

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

  async function handleManualRefresh() {
    if (refreshing || feedOffline) return;
    setRefreshing(true);
    try { await loadFeed(); } finally { setRefreshing(false); }
  }

  // Tapping Home while already on / dispatches 'frianzo:refresh-feed'
  // (see Shell). Same route = no remount, so without this the tap does
  // nothing and the feed never refetches. Kept behind a ref so the
  // listener always calls the latest handler without re-registering.
  const handleManualRefreshRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    handleManualRefreshRef.current = handleManualRefresh;
  });
  useEffect(() => {
    const handleRefreshFeed = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      void handleManualRefreshRef.current();
    };
    window.addEventListener('frianzo:refresh-feed', handleRefreshFeed);
    return () => window.removeEventListener('frianzo:refresh-feed', handleRefreshFeed);
  }, []);

  async function loadMore(fromRetry = false) {
    if (loadingMore || !hasMore || offline || feedOffline) return;
    // After a failed page fetch, only the sentinel's Retry button may
    // re-attempt — the observer must not spin on a dead request.
    if (loadMoreError && !fromRetry) return;
    setLoadingMore(true);
    setLoadMoreError(false);
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
      } else {
        // A failed page is not the end of the feed: keep the posts,
        // offset and hasMore exactly as they were and offer a retry.
        setLoadMoreError(true);
      }
    } catch {
      setLoadMoreError(true);
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
    setPosts((prev) => {
      const nextPosts = prev.map((p) => {
        if (p.id !== postId) return p;
        const newCounts = { ...(p.reactionCounts || {}) };
        if (p.myReaction) {
          newCounts[p.myReaction] = Math.max(0, (newCounts[p.myReaction] || 0) - 1);
          if (newCounts[p.myReaction] === 0) delete newCounts[p.myReaction];
        }
        if (reaction) newCounts[reaction] = (newCounts[reaction] || 0) + 1;
        return { ...p, myReaction: reaction, likeCount: count, reactionCounts: newCounts };
      });
      // LIKE FIX (2026-11-10): a like used to update screen state only —
      // the offline cache kept the pre-like copy, so after reload the
      // cache-first paint showed the post unliked, and SEEN RULE 2 hides
      // the (viewed) post from the fresh feed, so the liked state never
      // came back into view. Persist the reacted list so reload shows it.
      if (user?.id) void saveOfflineFeed(user.id, nextPosts, hasMore);
      return nextPosts;
    });
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
      return result;
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

  // No web loading screen here, on purpose: during the auth check the web
  // page renders nothing of its own. In the app the native 6-dots overlay
  // covers this stage until useAuth signals auth is done, so the user sees
  // only the original 6-dots loading and never a second Loading... screen.
  // The redirect effect above still fires for a logged-out app user, and
  // that redirect stage also renders nothing in the app. Auth/feed logic
  // is unchanged.
  if (loading) return null;
  if (!user) return isNativeApp ? null : <PublicLanding />;

  const openPost = posts.find((p) => p.id === openComments);

  return (
    <div className="mx-auto w-full max-w-xl py-6 md:max-w-5xl app-fade-in">
      <div className="mb-3 flex w-full items-center gap-2 px-4">
        <Link href={`/u/${user.username}`}><Avatar url={user.profilePictureUrl} name={user.displayName} px={32} /></Link>
        <button onClick={() => { if (!feedOffline) router.push('/compose'); }} disabled={feedOffline} className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-left text-slate-400 shadow-sm">
          What's on your mind?
        </button>
        <input ref={galleryInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;

          if (file.type.startsWith('image/')) {
            setPendingComposeImage(file);
            router.push('/compose');
            return;
          }

          if (!file.type.startsWith('video/')) {
            alert('Please select a photo or video.');
            return;
          }

          const objectUrl = URL.createObjectURL(file);
          const probe = document.createElement('video');
          probe.preload = 'metadata';
          probe.onloadedmetadata = async () => {
            const duration = probe.duration;
            URL.revokeObjectURL(objectUrl);
            probe.removeAttribute('src');
            probe.load();

            if (!Number.isFinite(duration) || duration <= 0) {
              alert('Could not read the video duration. Please choose another video.');
              return;
            }

            const config = await fetchReelsConfig();
            const configuredMax = Number(config.success && config.data?.maxDurationSec);
            const maxDuration = Number.isFinite(configuredMax) && configuredMax > 0 ? configuredMax : 180;

            if (duration > maxDuration) {
              alert(`Reels must be ${maxDuration} seconds or shorter.`);
              return;
            }

            setPendingReelVideo(file, duration);
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
        <button onClick={() => { if (!feedOffline) galleryInputRef.current?.click(); }} disabled={feedOffline} aria-label="Add a photo or video" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
          <PlusIcon />
        </button>
        <button onClick={() => { void handleManualRefresh(); }} disabled={refreshing || feedLoading || feedOffline} aria-label="Refresh feed" title="Refresh feed" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm disabled:opacity-50">
          <span className={refreshing ? 'animate-spin' : ''}><RefreshIcon /></span>
        </button>
      </div>

      <div className="px-4"><StatusBar user={user} offline={feedOffline} /></div>

      {feedLoading && posts.length === 0 ? (
        <div className="flex flex-col gap-3 px-4" role="status" aria-label="Loading feed">
          <SkeletonPostCard /><SkeletonPostCard /><SkeletonPostCard />
        </div>
      ) : posts.length > 0 ? (
        <>
          {feedError && (
            <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
              <p className="text-sm text-red-600">{autoRetrying ? 'Connection is slow, retrying…' : 'Could not refresh posts. Showing saved posts.'}</p>
              <button onClick={() => { autoRetryCountRef.current = 0; void loadFeed(); }} className="shrink-0 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white">Retry</button>
            </div>
          )}
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
                {((index + 1) === 1 || ((index + 1) > 1 && ((index + 1) - 1) % 4 === 0)) && <div key={`adsterra-feed-${post.id}`} className="my-4 flex justify-center px-4"><AdsterraBanner size="300x250" /></div>}
                {(index + 1) % 5 === 0 && <div className="my-4 px-4"><AdUnit /></div>}
                {(index + 1) % reelEvery === 0 && reels.length > 0 && <div className="my-4 px-4"><FeedReelCard reel={reels[Math.floor(index / reelEvery) % reels.length]} /></div>}
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="flex min-h-12 items-center justify-center px-4 py-4 text-sm text-slate-400">
            {loadingMore ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" role="status" aria-label="Loading more posts" /> : loadMoreError ? (
              <button onClick={() => loadMore(true)} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white">Couldn't load more posts. Tap to retry.</button>
            ) : hasMore ? null : "You're all caught up"}
          </div>
        </>
      ) : feedError ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <p className="text-sm text-red-500">{autoRetrying ? 'Connection is slow, retrying…' : 'Failed to load posts. Please try again.'}</p>
          <button onClick={() => { autoRetryCountRef.current = 0; void loadFeed(); }} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white">Retry</button>
        </div>
      ) : (
        <p className="px-4 text-slate-500">No posts yet. Be the first to post!</p>
      )}

      {shareModalPost && <ShareModal postId={shareModalPost} initialShareCode={posts.find((p) => p.id === shareModalPost)?.shareCode ?? null} onClose={() => setShareModalPost(null)} />}

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
