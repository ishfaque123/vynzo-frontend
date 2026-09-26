'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFeed } from '@/lib/api/postApi';
import { fetchReelFeed } from '@/lib/api/reelApi';
import { getOfflineFeed, saveOfflineFeed } from '@/lib/offline/feedCache';
import { fetchComments, addComment } from '@/lib/api/commentApi';
import { playCommentSound } from '@/lib/sounds';
import ShareModal from '@/components/ShareModal';
import CommentsModal from '@/components/CommentsModal';
import PostCard from '@/components/PostCard';
import AdUnit from '@/components/AdUnit';
import { setPendingComposeImage } from '@/lib/pendingComposeImage';
import StatusBar from '@/components/StatusBar';
import SkeletonPostCard from '@/components/SkeletonPostCard';
import FeedReelCard from '@/components/FeedReelCard';

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

function PublicLanding() {
  const features = [
    { title: 'Posts & Photos', text: 'Share text, photos and everyday moments with the people you follow.', icon: '✦' },
    { title: 'Reels', text: 'Watch and discover short-form videos directly in your social feed.', icon: '▶' },
    { title: 'Stories', text: 'Share quick updates and moments that stay fresh and easy to discover.', icon: '◌' },
    { title: 'Comments & Replies', text: 'Join conversations with comments and replies on posts.', icon: '↩' },
    { title: 'Profiles & Follow', text: 'Discover people, explore profiles and follow accounts you care about.', icon: '◎' },
    { title: 'Reactions', text: 'React to posts and see how the community responds to shared content.', icon: '♡' },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_42%),radial-gradient(circle_at_15%_20%,_rgba(59,130,246,0.10),_transparent_35%)]" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-blue-600 shadow-sm">
              <img src="/logo.png" alt="Frianzo" className="h-full w-full object-cover" />
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-blue-600">Frianzo</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-blue-600">Features</a>
            <a href="#about" className="transition hover:text-blue-600">About</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Log in
            </Link>
            <Link href="/login" className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Sign up
            </Link>
          </div>
        </header>

        <section id="about" className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28 lg:pt-20">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Your social space
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-6xl">
              Connect. Share. <span className="text-blue-600">Discover.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Frianzo is a social platform for sharing posts, photos, stories and reels,
              discovering people, following profiles and joining conversations through comments and reactions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="rounded-full bg-blue-600 px-7 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                Create Account
              </Link>
              <Link href="/login" className="rounded-full border border-slate-200 bg-white px-7 py-3.5 text-center text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                Log in
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500">Join Frianzo from the web — no app install required.</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-blue-100/60 blur-2xl" />
            <div className="mx-auto w-[285px] rounded-[2.7rem] border-[7px] border-slate-900 bg-slate-950 p-2 shadow-2xl sm:w-[320px]">
              <div className="overflow-hidden rounded-[2.15rem] bg-slate-50">
                <div className="flex items-center justify-between bg-white px-4 py-3">
                  <span className="text-sm font-extrabold text-blue-600">Frianzo</span>
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                </div>
                <div className="space-y-3 p-3">
                  <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm">
                    <div className="h-8 w-8 rounded-full bg-blue-100" />
                    <div className="h-2.5 w-24 rounded-full bg-slate-200" />
                  </div>
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="flex items-center gap-2 p-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100" />
                      <div>
                        <div className="h-2.5 w-20 rounded-full bg-slate-300" />
                        <div className="mt-1.5 h-2 w-12 rounded-full bg-slate-200" />
                      </div>
                    </div>
                    <div className="h-36 bg-gradient-to-br from-blue-100 via-slate-100 to-blue-200" />
                    <div className="flex items-center gap-5 px-3 py-3 text-slate-500">
                      <span>♡</span><span>◌</span><span>↗</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Stories</span>
                      <span className="text-[10px] text-blue-600">View all</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-14 w-14 rounded-full border-2 border-blue-500 bg-blue-100" />
                      <div className="h-14 w-14 rounded-full border-2 border-slate-200 bg-slate-100" />
                      <div className="h-14 w-14 rounded-full border-2 border-slate-200 bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-slate-100 bg-slate-50/80 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Everything in one place</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Made for sharing and connecting</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
                Explore the core social features available across Frianzo.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">About Frianzo</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">A place to share what matters to you</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Frianzo brings social sharing, short-form video, stories, profiles and conversations
            together in one accessible web platform. Visitors can explore what Frianzo offers publicly,
            while members can create an account and start connecting with others.
          </p>
        </section>

        <footer className="border-t border-slate-200 bg-slate-950 px-5 py-10 text-white sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xl font-extrabold">Frianzo</div>
              <p className="mt-1 text-sm text-slate-400">Connect. Share. Discover.</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
              <Link href="/about" className="transition hover:text-white">About</Link>
              <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-white">Terms</Link>
              <a href="mailto:support@frianzo.online" className="transition hover:text-white">Support</a>
            </div>
          </div>
          <div className="mx-auto mt-7 max-w-6xl border-t border-white/10 pt-5 text-xs text-slate-500">
            © {new Date().getFullYear()} Frianzo. All rights reserved.
          </div>
        </footer>
      </div>
    </main>
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
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
  const [shareModalPost, setShareModalPost] = useState<string | null>(null);
  const commentsSeqRef = useRef<Record<string, number>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function loadFeed() {
    if (!user?.id) return;
    if (posts.length === 0) setFeedLoading(true);
    setFeedError(false);

    if (offline || feedOffline) {
      const cached = await getOfflineFeed(user.id);
      if (cached?.posts?.length) {
        setPosts(cached.posts);
        setHasMore(false);
        setOffset(cached.posts.length);
        setFeedOffline(true);
      } else {
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

  if (loading) return null;
  if (!user) return <PublicLanding />;

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
        <button onClick={() => { if (!feedOffline) galleryInputRef.current?.click(); }} disabled={feedOffline} aria-label="Add a photo" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
          <PlusIcon />
        </button>
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
