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

// HOME FEED SNAPSHOT (2026-11-12): Notifications/Profile are separate
// routes, so this component unmounts on in-app navigation and used to
// replay the offline cache + a fresh fetch on return — the feed visibly
// reloaded, re-ordered, and lost the scroll position. Facebook instead
// keeps the feed exactly where you left it. This snapshot remembers the
// live feed state so a remount can restore it untouched instead of
// running loadFeed. SNAPSHOT v4 (2026-11-12): it lives in module memory
// AND in sessionStorage, so even a full document load inside the same
// tab can restore it; a 10-minute freshness cap (savedAt) stops a
// stale snapshot from ever being restored.
type HomeFeedSnapshot = {
  userId: string;
  posts: any[];
  reels: any[];
  reelEvery: number;
  reelsHasMore: boolean;
  hasMore: boolean;
  offset: number;
  feedOffline: boolean;
  scrollY: number;
  // SCROLL RESTORE v2 (2026-11-12): the anchor is the first at least
  // partly visible post when the user leaves Home, plus that post's
  // viewport-top offset (rect.top, may be negative). Raw scrollY alone
  // is not a stable restore target while the page is still growing.
  anchorPostId: string | null;
  anchorOffsetPx: number;
  // SNAPSHOT v4 (2026-11-12): when this snapshot was last written
  // (Date.now()). Restores only happen within the freshness cap below,
  // so an hours-old feed is never resurrected.
  savedAt: number;
};
let homeFeedSnapshot: HomeFeedSnapshot | null = null;

// SNAPSHOT v4 (2026-11-12): sessionStorage copy of the snapshot. The
// module-scope copy dies with the document, and live tests showed the
// first return in a session sometimes behaves like a full document
// load — the old cache+fetch behaviour then came back. sessionStorage
// survives full document loads inside the same tab, so the snapshot
// does too. Every access is wrapped in try/catch: storage can be
// blocked or over quota, and in that case the memory snapshot simply
// carries on alone (exactly the pre-v4 behaviour).
const HOME_SNAPSHOT_KEY = 'frianzo:home-feed-snapshot';
const HOME_SNAPSHOT_MAX_AGE_MS = 10 * 60 * 1000;

function isFreshHomeSnapshot(snap: HomeFeedSnapshot): boolean {
  return typeof snap.savedAt === 'number' && Date.now() - snap.savedAt < HOME_SNAPSHOT_MAX_AGE_MS;
}

function persistHomeSnapshot() {
  try {
    if (homeFeedSnapshot) sessionStorage.setItem(HOME_SNAPSHOT_KEY, JSON.stringify(homeFeedSnapshot));
  } catch {
    // Quota exceeded or storage blocked: memory snapshot still works.
  }
}

function clearHomeSnapshot() {
  homeFeedSnapshot = null;
  try {
    sessionStorage.removeItem(HOME_SNAPSHOT_KEY);
  } catch {
    // Storage unavailable: nothing persisted to clear.
  }
}

// Load the sessionStorage copy into memory when memory is empty.
// Accepts only a well-shaped, fresh snapshot; on any parse/shape
// failure the stored key is removed and memory stays empty.
function hydrateHomeSnapshot() {
  if (homeFeedSnapshot) return;
  let parsed: any = null;
  try {
    const raw = sessionStorage.getItem(HOME_SNAPSHOT_KEY);
    if (!raw) return;
    parsed = JSON.parse(raw);
  } catch {
    try { sessionStorage.removeItem(HOME_SNAPSHOT_KEY); } catch { /* storage unavailable */ }
    return;
  }
  if (
    parsed &&
    typeof parsed === 'object' &&
    typeof parsed.userId === 'string' &&
    Array.isArray(parsed.posts) &&
    parsed.posts.length > 0 &&
    typeof parsed.savedAt === 'number' &&
    Date.now() - parsed.savedAt < HOME_SNAPSHOT_MAX_AGE_MS
  ) {
    homeFeedSnapshot = parsed as HomeFeedSnapshot;
  } else {
    try { sessionStorage.removeItem(HOME_SNAPSHOT_KEY); } catch { /* storage unavailable */ }
  }
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
  // HOME FEED SNAPSHOT (2026-11-12): snapshotRestoredRef stops the mount
  // effect from restoring twice on one mount; snapshotSaveReadyRef stops
  // the save effect from overwriting the snapshot with the empty initial
  // state before the mount effect has restored or started a real load.
  const snapshotRestoredRef = useRef(false);
  const snapshotSaveReadyRef = useRef(false);
  // SCROLL RESTORE v2 (2026-11-12): the in-flight restore-retry interval,
  // so it can be cleared on unmount and when a new restore starts.
  const snapshotScrollRestoreRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    return () => {
      if (snapshotScrollRestoreRef.current) {
        clearInterval(snapshotScrollRestoreRef.current);
        snapshotScrollRestoreRef.current = null;
      }
    };
  }, []);

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

  async function loadFeed(isAutoRetry = false, force = false) {
    // HOME FEED SNAPSHOT GUARD (2026-11-12): once this mount restored the
    // snapshot, no automatic trigger (mount-effect fallthrough when the
    // auth offline flag flips, the window 'online' handler, an auto-retry
    // timer) may replace the restored feed — only an explicit user
    // refresh (force = true: manual refresh / Retry buttons) may.
    if (snapshotRestoredRef.current && !force) return;
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
      setReels(diversifiedReels);
      // The first reel page reports whether more reels exist; a refresh
      // resets the pagination state along with the reel list.
      setReelsHasMore(reelPage1?.success ? !!reelPage1.data?.hasMore : true);
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

  // HOME FEED SNAPSHOT (2026-11-12): on (re)mount, if a snapshot from
  // this same account exists, restore the exact list + scroll position
  // and skip loadFeed entirely — returning from Notifications/Profile
  // then shows the feed exactly where the user left it. With no usable
  // snapshot (first visit, different account, or — v4 — older than the
  // 10-minute freshness cap) loadFeed runs exactly as before. A fresh
  // snapshot survives even a full page reload via sessionStorage (v4).
  useEffect(() => {
    if (!isAuthenticated) return;
    // SNAPSHOT v4 (2026-11-12): memory is empty after a full document
    // load — hydrate from sessionStorage before deciding. A snapshot
    // from another account, or one past the freshness cap, is cleared
    // (memory + storage) and loadFeed runs as normal.
    hydrateHomeSnapshot();
    let snap = homeFeedSnapshot;
    if (snap && ((user?.id && snap.userId !== user.id) || !isFreshHomeSnapshot(snap))) {
      clearHomeSnapshot();
      snap = null;
    }
    if (!snapshotRestoredRef.current && snap && user?.id && snap.userId === user.id && snap.posts.length > 0 && isFreshHomeSnapshot(snap)) {
      snapshotRestoredRef.current = true;
      snapshotSaveReadyRef.current = true;
      // A post created while away (compose flow) is normally prepended by
      // loadFeed; since this mount skips loadFeed, prepend it here too so
      // the user's new post is not missing from the restored feed.
      const pendingPost = takePendingNewPost();
      setPosts(pendingPost && !snap.posts.some((p: any) => p.id === pendingPost.id) ? [pendingPost, ...snap.posts] : snap.posts);
      setReels(snap.reels);
      setReelEvery(snap.reelEvery);
      setReelsHasMore(snap.reelsHasMore);
      setHasMore(snap.hasMore);
      setOffset(snap.offset);
      setFeedOffline(snap.feedOffline);
      setFeedLoading(false);
      // SCROLL RESTORE v2 (2026-11-12): v1's fixed rAF + 50ms + 200ms
      // scrollTo retries fired while images/fonts were still settling
      // and the page height was still growing, so the scroll got clamped
      // back to the top. Retry every 100ms for up to ~2.5s instead. Each
      // attempt aims at the anchor post (the first visible post when the
      // user left): its document top minus the viewport offset it had
      // then — a target that stays correct as the page grows. Without an
      // anchor, aim at the saved scrollY. Stop once the scroll lands
      // within 4px of the target on two consecutive attempts, and cancel
      // instantly on any user scroll intent (wheel / touch / pointer /
      // key) so the routine never fights the user.
      if (snapshotScrollRestoreRef.current) {
        clearInterval(snapshotScrollRestoreRef.current);
        snapshotScrollRestoreRef.current = null;
      }
      const restoreScrollY = snap.scrollY;
      const restoreAnchorId = snap.anchorPostId;
      const restoreAnchorOffset = snap.anchorOffsetPx;
      let restoreAttempts = 0;
      let restoreHits = 0;
      const cancelRestore = () => {
        if (snapshotScrollRestoreRef.current) {
          clearInterval(snapshotScrollRestoreRef.current);
          snapshotScrollRestoreRef.current = null;
        }
        window.removeEventListener('wheel', cancelRestore);
        window.removeEventListener('touchstart', cancelRestore);
        window.removeEventListener('pointerdown', cancelRestore);
        window.removeEventListener('keydown', cancelRestore);
      };
      const attemptRestore = () => {
        restoreAttempts += 1;
        let target = restoreScrollY;
        if (restoreAnchorId) {
          const anchorEl = document.querySelector('[data-home-post="' + restoreAnchorId + '"]');
          if (anchorEl) {
            target = anchorEl.getBoundingClientRect().top + window.scrollY - restoreAnchorOffset;
          }
        }
        if (target < 0) target = 0;
        window.scrollTo(0, target);
        if (Math.abs(window.scrollY - target) <= 4) {
          restoreHits += 1;
        } else {
          restoreHits = 0;
        }
        if (restoreHits >= 2 || restoreAttempts >= 25) cancelRestore();
      };
      window.addEventListener('wheel', cancelRestore, { once: true, passive: true });
      window.addEventListener('touchstart', cancelRestore, { once: true, passive: true });
      window.addEventListener('pointerdown', cancelRestore, { once: true });
      window.addEventListener('keydown', cancelRestore, { once: true });
      attemptRestore();
      snapshotScrollRestoreRef.current = setInterval(attemptRestore, 100);
      return;
    }
    snapshotSaveReadyRef.current = true;
    loadFeed();
  }, [isAuthenticated, offline]);

  // HOME FEED SNAPSHOT (2026-11-12): keep the snapshot in step with the
  // live feed state, so leaving Home at any moment returns to exactly
  // what was on screen. An explicit refresh (frianzo:refresh-feed ->
  // handleManualRefresh -> loadFeed) replaces the state, and this effect
  // then overwrites the snapshot with the fresh list on its own. Empty
  // post lists are never saved: the pre-restore initial state must not
  // clobber a good snapshot, and an empty feed simply loads as before.
  useEffect(() => {
    if (!snapshotSaveReadyRef.current || !user?.id || posts.length === 0) return;
    homeFeedSnapshot = {
      userId: user.id,
      posts,
      reels,
      reelEvery,
      reelsHasMore,
      hasMore,
      offset,
      feedOffline,
      scrollY: homeFeedSnapshot && homeFeedSnapshot.userId === user.id ? homeFeedSnapshot.scrollY : window.scrollY,
      anchorPostId: homeFeedSnapshot && homeFeedSnapshot.userId === user.id ? homeFeedSnapshot.anchorPostId : null,
      anchorOffsetPx: homeFeedSnapshot && homeFeedSnapshot.userId === user.id ? homeFeedSnapshot.anchorOffsetPx : 0,
      savedAt: Date.now(),
    };
    persistHomeSnapshot();
  }, [user?.id, posts, reels, reelEvery, reelsHasMore, hasMore, offset, feedOffline]);

  // HOME FEED SNAPSHOT (2026-11-12): track the scroll position
  // continuously so the snapshot always holds where the user left off.
  // SCROLL RESTORE v2 (2026-11-12): also record the anchor — the first
  // post whose bottom edge is still on screen, and its viewport-top
  // offset. Throttled by a rAF flag so it runs at most once per frame.
  useEffect(() => {
    let anchorFrame = 0;
    // SNAPSHOT v4 (2026-11-12): persist only when the anchor post
    // changes, so the stored copy stays fresh without stringifying
    // the whole feed on every scroll frame.
    let lastAnchorId: string | null = null;
    const recordAnchor = () => {
      anchorFrame = 0;
      if (!homeFeedSnapshot || !user?.id || homeFeedSnapshot.userId !== user.id) return;
      const els = document.querySelectorAll('[data-home-post]');
      for (let i = 0; i < els.length; i++) {
        const rect = els[i].getBoundingClientRect();
        if (rect.bottom > 0) {
          const anchorId = els[i].getAttribute('data-home-post');
          homeFeedSnapshot.anchorPostId = anchorId;
          homeFeedSnapshot.anchorOffsetPx = rect.top;
          if (anchorId !== lastAnchorId) {
            lastAnchorId = anchorId;
            // The user is on Home right now: refresh savedAt too, so
            // the freshness cap measures the time since he left Home,
            // not the time since the feed state last changed.
            homeFeedSnapshot.savedAt = Date.now();
            persistHomeSnapshot();
          }
          break;
        }
      }
    };
    const handleScroll = () => {
      if (homeFeedSnapshot && user?.id && homeFeedSnapshot.userId === user.id) {
        homeFeedSnapshot.scrollY = window.scrollY;
        if (!anchorFrame) anchorFrame = requestAnimationFrame(recordAnchor);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (anchorFrame) cancelAnimationFrame(anchorFrame);
    };
  }, [user?.id]);

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
    try { await loadFeed(false, true); } finally { setRefreshing(false); }
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
              <button onClick={() => { autoRetryCountRef.current = 0; void loadFeed(false, true); }} className="shrink-0 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white">Retry</button>
            </div>
          )}
          <div className="flex flex-col">
            {posts.map((post, index) => (
              <div key={post.id} data-home-post={post.id}>
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
          <button onClick={() => { autoRetryCountRef.current = 0; void loadFeed(false, true); }} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white">Retry</button>
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
