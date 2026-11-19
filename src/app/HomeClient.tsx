'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFeed, fetchContentMix } from '@/lib/api/postApi';
import { fetchReelsConfig, fetchReelFeed } from '@/lib/api/reelApi';
import { getOfflineFeed, saveOfflineFeed } from '@/lib/offline/feedCache';
import { readFeedSnapshot, saveFeedSnapshot } from '@/lib/offline/feedSnapshot';
import { fetchComments, addComment } from '@/lib/api/commentApi';
import { playCommentSound } from '@/lib/sounds';
import ShareModal from '@/components/ShareModal';
import CommentsModal from '@/components/CommentsModal';
import PostCard from '@/components/PostCard';
import AdUnit from '@/components/AdUnit';
import { setPendingComposeImage } from '@/lib/pendingComposeImage';
import { takePendingNewPost } from '@/lib/pendingNewPost';
import { setPendingReelVideo } from '@/lib/pendingReelVideo';
import StatusBar from '@/components/StatusBar';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import FeedReelCard from '@/components/FeedReelCard';
import PublicLanding from '@/components/PublicLanding';
import Avatar from '@/components/Avatar';

// NAVIGATION MEMORY (2026-11-19): the home feed keeps its loaded state
// in module scope, so leaving for a profile and coming back restores
// the exact list, order and scroll position instead of refetching
// page 1 from zero. A return within FEED_MEMORY_FRESH_MS does not
// refetch at all; a later return still paints instantly and refreshes
// quietly in the background WITHOUT replacing the list on screen.
// Manual refresh (Home tap / pull-to-refresh) always loads a whole
// new feed, exactly as before.
const FEED_MEMORY_FRESH_MS = 60_000;
type FeedMemory = {
  userId: string;
  posts: any[];
  reels: any[];
  reelEvery: number;
  reelsHasMore: boolean;
  offset: number;
  hasMore: boolean;
  scrollY: number;
  savedAt: number;
};
let feedMemory: FeedMemory | null = null;

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// REEL AUTHOR DIVERSITY (2026-11-11): author id of a home-feed reel object.
// The backend returns userId at the top level and author.id inside author;
// fall back to the reel id itself (unique, so it never blocks the greedy).
function reelAuthorOf(r: any): string {
  return r?.userId ?? r?.author?.id ?? r?.id ?? '';
}

export default function HomePage() {
  const { user, loading, isAuthenticated, offline } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  // Adaptive feed mix: how often reels are injected among posts, based on the
  // user's actual consumption (reelRatio 0..1 from /api/posts/content-mix).
  const [reelEvery, setReelEvery] = useState(2);
  // REEL REPEAT FIX (2026-11-10): whether the backend still has reels
  // beyond the loaded set. Set from the first reel page's hasMore and
  // from each pagination fetch; false stops further reel requests.
  const [reelsHasMore, setReelsHasMore] = useState(true);
  const loadingReelsRef = useRef(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedOffline, setFeedOffline] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [autoRetrying, setAutoRetrying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Which user's instant-open snapshot has been applied during render
  // (see the render-phase block further down). Tracked per user id so
  // an account change re-applies the correct account's snapshot.
  const [snapshotUserId, setSnapshotUserId] = useState<string | null>(null);
  const autoRetryCountRef = useRef(0);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
  const [shareModalPost, setShareModalPost] = useState<string | null>(null);
  const commentsSeqRef = useRef<Record<string, number>>({});
  // CACHE-FIRST STARTUP (2026-11-19): whether the on-screen list was
  // painted from the localStorage snapshot (see the render-phase block
  // further down), and whether the user has scrolled away from the top
  // since. Together they drive the swap rule in loadFeed(): a fresh
  // first page replaces the painted list only while the user is still
  // at the top; once they are reading, the list is never yanked away —
  // the fresh page is saved to the caches for the next open instead.
  const paintedSnapshotRef = useRef(false);
  const userScrolledRef = useRef(false);
  const ignoreScrollUntilRef = useRef(0);
  const loadInFlightRef = useRef(false);
  const didInitRef = useRef(false);
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

  // Prepend the just-published post held by pendingNewPost
  // (Facebook/Instagram behavior). loadFeed() calls this on every load;
  // the 'frianzo:post-published' listener below calls it when a
  // background upload finishes while this feed is already on screen —
  // the normal case now that the composer hands the upload off and
  // navigates here before the upload completes.
  function prependPendingPost() {
    const pendingPost = takePendingNewPost();
    if (!pendingPost) return;
    setPosts((prev: any[]) => {
      if (prev.some((p: any) => p.id === pendingPost.id)) return prev;
      return [pendingPost, ...prev];
    });
  }

  async function loadFeed(isAutoRetry = false, keepList = false) {
    prependPendingPost();
    if (!user?.id) return;
    // Never stack a second full load on top of one already running:
    // overlapping triggers (mount, online event, auto-retry) collapse
    // into the single in-flight load.
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    if (!isAutoRetry) {
      autoRetryCountRef.current = 0;
      setAutoRetrying(false);
      if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
    }
    setFeedError(false);
    setLoadMoreError(false);

    // Cache-first startup: show the last successful feed immediately when
    // available. Network refresh happens afterwards, so reopening the app
    // does not force the user through a skeleton every time. When the
    // localStorage snapshot was already painted during render (see the
    // render-phase block below), skip this IndexedDB paint: the snapshot
    // is the same first page, read synchronously, and painting the
    // IndexedDB copy over it would only swap one cached list for another
    // before the network answer arrives. The IndexedDB copy is still
    // read for the offline early-return below.
    let cachedPosts: any[] | null = null;
    try {
      const cached = await getOfflineFeed(user.id);
      if (cached?.posts?.length) {
        cachedPosts = cached.posts;
        if (!paintedSnapshotRef.current) {
          setPosts(cached.posts);
          setHasMore(!!cached.hasMore);
          setOffset(cached.posts.length);
          setFeedOffline(false);
          setFeedLoading(false);
        }
      } else if (posts.length === 0 && !paintedSnapshotRef.current) {
        setFeedLoading(true);
      }
    } catch {
      if (posts.length === 0 && !paintedSnapshotRef.current) setFeedLoading(true);
    }

    if ((offline || feedOffline) && !navigator.onLine) {
      if (cachedPosts?.length) {
        setFeedOffline(true);
        setHasMore(false);
      } else if (posts.length === 0) {
        setFeedError(true);
      }
      setFeedLoading(false);
      loadInFlightRef.current = false;
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
        // SWAP RULE (2026-11-19): replace the on-screen list with the
        // fresh first page only while the user is still at the top.
        // If they already scrolled into the painted snapshot, keep
        // their list untouched — replacing it would yank away the post
        // they are reading. The fresh page is saved to both caches
        // either way, so the next open (or a manual refresh, which
        // resets the scroll flag) shows it.
        if (!keepList && !userScrolledRef.current) {
          setPosts(result.data.posts);
          setHasMore(!!result.data.hasMore);
          setOffset(result.data.posts.length);
        }
        setFeedOffline(false);
        await saveOfflineFeed(user.id, result.data.posts, !!result.data.hasMore);
        saveFeedSnapshot(user.id, result.data.posts, !!result.data.hasMore);
      } else if (!keepList) {
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
      // REEL AUTHOR DIVERSITY (2026-11-11): the backend diversifies, but
      // this client sort (friends-first, then likes) re-bunches one
      // author's reels together — a prolific author with high-like reels
      // lands back-to-back on page 1. Re-run the same greedy
      // no-same-author-back-to-back reorder after sorting, so the first
      // page keeps the friends/likes bias approximately (the greedy picks
      // the highest-ranked first, just skips same-author consecutively).
      // Same greedy rule as the posts diversity fix.
      const diversifiedReels: any[] = [];
      const remainingReels = [...sortedReels];
      while (remainingReels.length > 0) {
        let pickIdx = 0;
        if (diversifiedReels.length > 0) {
          const lastAuthor = reelAuthorOf(diversifiedReels[diversifiedReels.length - 1]);
          pickIdx = remainingReels.findIndex((r: any) => reelAuthorOf(r) !== lastAuthor);
          if (pickIdx === -1) pickIdx = 0;
        }
        diversifiedReels.push(remainingReels[pickIdx]);
        remainingReels.splice(pickIdx, 1);
      }
      if (!keepList) {
        setReels(diversifiedReels);
        // The first reel page reports whether more reels exist; a refresh
        // resets the pagination state along with the reel list.
        setReelsHasMore(reelPage1?.success ? !!reelPage1.data?.hasMore : true);
      }
    } catch {
      // With keepList the remembered feed is already on screen: a failed
      // background refresh changes nothing and shows no error.
      if (!keepList) {
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
      }
    } finally {
      setFeedLoading(false);
      loadInFlightRef.current = false;
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !user?.id || didInitRef.current) return;
    didInitRef.current = true;
    const mem = feedMemory;
    if (mem && mem.userId === user.id && mem.posts.length) {
      // Returning to Home: the render-phase block below already painted
      // the remembered list. Put the scroll position back once the
      // content has height, and refetch only when the memory is stale
      // (quietly, keeping the list on screen).
      const y = mem.scrollY;
      if (y > 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, y);
          setTimeout(() => {
            if (window.scrollY < y - 4) window.scrollTo(0, y);
          }, 250);
        });
      }
      if (Date.now() - mem.savedAt > FEED_MEMORY_FRESH_MS) void loadFeed(false, true);
      return;
    }
    void loadFeed();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    let onlineTimer: ReturnType<typeof setTimeout> | null = null;
    const handleOnline = () => {
      setFeedOffline(false);
      if (!isAuthenticated) return;
      // A flaky connection can flap offline/online several times in a
      // few seconds; collapse that storm into ONE reload 1.5s after
      // the last 'online' event (loadFeed also refuses to stack on a
      // load already in flight).
      if (onlineTimer) clearTimeout(onlineTimer);
      onlineTimer = setTimeout(() => { void loadFeed(); }, 1500);
    };
    const handleOffline = () => setFeedOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      if (onlineTimer) clearTimeout(onlineTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated]);

  // Swap-rule scroll tracking: any scroll away from the top counts as
  // "the user is reading" and blocks the background swap in loadFeed().
  // Scroll events are ignored for a second after a manual refresh
  // starts: tapping Home first smooth-scrolls to the top, and those
  // animation events must not re-block the very swap the tap asked for.
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 8 && Date.now() > ignoreScrollUntilRef.current) {
        userScrolledRef.current = true;
      }
      if (feedMemory) feedMemory.scrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keep the navigation memory in sync with what is on screen, so a
  // return visit restores exactly this list (likes/edits included).
  useEffect(() => {
    if (!user?.id || posts.length === 0) return;
    feedMemory = {
      userId: user.id,
      posts,
      reels,
      reelEvery,
      reelsHasMore,
      offset,
      hasMore,
      scrollY: feedMemory?.userId === user.id ? (feedMemory?.scrollY ?? 0) : 0,
      savedAt: Date.now(),
    };
  }, [posts, reels, reelEvery, reelsHasMore, offset, hasMore, user?.id]);

  async function handleManualRefresh() {
    if (refreshing || feedOffline) return;
    // A manual refresh is an explicit "show me fresh": allow the swap
    // again and ignore the scroll-to-top animation's scroll events.
    userScrolledRef.current = false;
    ignoreScrollUntilRef.current = Date.now() + 1000;
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

  // A background post upload (see lib/pendingPostUpload) dispatches
  // 'frianzo:post-published' when it finishes; prepend the new post to
  // the feed already on screen. Kept behind a ref so the listener
  // always calls the latest handler without re-registering, same as
  // the refresh-feed listener above.
  const prependPendingPostRef = useRef<() => void>(() => {});
  useEffect(() => {
    prependPendingPostRef.current = prependPendingPost;
  });
  useEffect(() => {
    const handlePostPublished = () => prependPendingPostRef.current();
    window.addEventListener('frianzo:post-published', handlePostPublished);
    return () => window.removeEventListener('frianzo:post-published', handlePostPublished);
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
          saveFeedSnapshot(user.id, nextPosts, !!result.data.hasMore);
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

  // REEL REPEAT FIX (2026-11-10): the home feed used to fetch reels once
  // (page 1, <=10) and cycle them by modulo forever, so the same reels
  // repeated in every batch. When the rendered reel slots get within 2 of
  // the end of the loaded reels, fetch the next page (exclude-based, so
  // already-shown reels are never re-served) and append it. Best-effort:
  // a failed fetch just waits for the next trigger; nothing is shown to
  // the user and post loading is untouched.
  async function loadMoreReels() {
    if (loadingReelsRef.current || !reelsHasMore) return;
    const excludeIds = reels.map((r: any) => r?.id).filter((id: any) => typeof id === 'string' && id.length > 0);
    if (excludeIds.length === 0) return;
    loadingReelsRef.current = true;
    try {
      const result = await fetchReelFeed(0, 'foryou', 30000, excludeIds);
      if (!result.success) return;
      const incoming = (result.data?.reels || []).filter((r: any) => r && typeof r.id === 'string');
      setReels((prev: any[]) => {
        const existingIds = new Set(prev.map((r: any) => r.id));
        const fresh = incoming.filter((r: any) => !existingIds.has(r.id));
        // Page-boundary join: if the first new reel shares the last shown
        // reel's author, swap in the next new reel of a different author,
        // so the boundary does not create a back-to-back pair the backend
        // could not see (it knows the excluded ids, not their order).
        if (prev.length > 0 && fresh.length > 1) {
          const lastAuthor = reelAuthorOf(prev[prev.length - 1]);
          if (reelAuthorOf(fresh[0]) === lastAuthor) {
            const swapIdx = fresh.findIndex((r: any, i: number) => i > 0 && reelAuthorOf(r) !== lastAuthor);
            if (swapIdx > 0) {
              const tmp = fresh[0];
              fresh[0] = fresh[swapIdx];
              fresh[swapIdx] = tmp;
            }
          }
        }
        return fresh.length ? [...prev, ...fresh] : prev;
      });
      // Exclude mode reports hasMore = paged.length < total. No new reels
      // (or hasMore false) means the backend is exhausted — stop asking.
      if (!incoming.length || !result.data?.hasMore) setReelsHasMore(false);
    } finally {
      loadingReelsRef.current = false;
    }
  }

  useEffect(() => {
    if (reels.length === 0 || !reelsHasMore) return;
    // Reel slots rendered = floor(posts / reelEvery); the highest rendered
    // reel index is slots - 1. Fetch when it is within 2 of the end.
    const slots = Math.floor(posts.length / Math.max(1, reelEvery));
    if (slots >= reels.length - 2) void loadMoreReels();
  }, [posts.length, reels.length, reelEvery, reelsHasMore]);

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
      // The localStorage snapshot is the paint source now, so it gets
      // the same reacted list (its first page) for the same reason.
      if (user?.id) {
        void saveOfflineFeed(user.id, nextPosts, hasMore);
        saveFeedSnapshot(user.id, nextPosts, hasMore);
      }
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

  // INSTANT-OPEN SNAPSHOT PAINT (2026-11-19): the first render that
  // knows the user applies the saved first page from localStorage
  // right here — synchronously, before this render commits — so a
  // reopened app shows the feed in the very first visible frame
  // instead of the skeleton, and loadFeed()'s background fetch then
  // applies the swap rule. This is React's render-phase state
  // adjustment pattern: the setState calls re-render this component
  // before anything is painted. Guarded per user id: if the verified
  // user turns out to be a different account than the optimistic
  // cached one and that account has no snapshot, the previous
  // account's painted posts are dropped back to the loading state
  // rather than shown to the wrong user. Any snapshot problem reads
  // as "no snapshot" (readFeedSnapshot never throws) and startup
  // continues with the normal network load, exactly as before.
  if (user?.id && snapshotUserId !== user.id) {
    setSnapshotUserId(user.id);
    const mem = feedMemory && feedMemory.userId === user.id && feedMemory.posts.length ? feedMemory : null;
    const snap = mem ? null : readFeedSnapshot(user.id);
    if (mem) {
      // Navigation memory is newer than the stored snapshot (it holds
      // the exact list, pagination and scroll the user left): paint it.
      paintedSnapshotRef.current = true;
      userScrolledRef.current = mem.scrollY > 8;
      setPosts(mem.posts);
      setReels(mem.reels);
      setReelEvery(mem.reelEvery);
      setReelsHasMore(mem.reelsHasMore);
      setHasMore(mem.hasMore);
      setOffset(mem.offset);
      setFeedOffline(false);
      setFeedLoading(false);
    } else if (snap) {
      paintedSnapshotRef.current = true;
      setPosts(snap.posts);
      setHasMore(snap.hasMore);
      setOffset(snap.posts.length);
      setFeedOffline(false);
      setFeedLoading(false);
    } else if (paintedSnapshotRef.current) {
      paintedSnapshotRef.current = false;
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      setFeedLoading(true);
    }
  }

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
                {(index + 1) % 5 === 0 && <div className="my-4 px-4"><AdUnit /></div>}
                {(index + 1) % reelEvery === 0 && reels.length > 0 && <div className="my-4 px-4"><FeedReelCard reel={reels[Math.floor(index / reelEvery) % reels.length]} currentUser={user} /></div>}
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
