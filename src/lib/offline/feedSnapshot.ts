// Instant-open snapshot of the home feed's first page.
//
// The IndexedDB offline cache (feedCache.ts) can only be read
// asynchronously, so on a cold start the home feed still paints its
// skeleton first and swaps the cached posts in a tick later — and on
// the owner's slow connections that skeleton is what the user stares
// at. This snapshot lives in localStorage instead, which can be read
// SYNCHRONOUSLY during render: the first frame that knows the user
// already contains the saved posts, and the network refresh happens
// in the background (HomeClient applies the swap rule there).
//
// Scope and safety:
// - Per-user key, so an account switch on the same device never
//   paints the previous account's feed.
// - First page only: at most MAX_POSTS posts, and the serialized
//   snapshot is dropped rather than stored when it exceeds
//   MAX_CHARS (post DTOs carry image URLs, not image data, so a
//   first page is normally far below the cap; the cap exists so a
//   pathological payload can never eat the localStorage quota that
//   the theme setting and other features share).
// - Every read validates the parsed shape before returning it, and
//   every operation is wrapped in try/catch: a missing, corrupt or
//   oversized snapshot simply means "no snapshot", and the caller
//   falls back to the normal network load. This cache must never be
//   able to break the feed.

const KEY_PREFIX = 'frianzo:feed-snapshot:';
const MAX_POSTS = 30;
const MAX_CHARS = 1500000;

export interface FeedSnapshot {
  posts: any[];
  hasMore: boolean;
  savedAt: number;
}

function keyFor(userId: string): string {
  return KEY_PREFIX + userId;
}

function isValidPost(post: any): boolean {
  return (
    !!post &&
    typeof post === 'object' &&
    typeof post.id === 'string' &&
    post.id.length > 0
  );
}

export function readFeedSnapshot(userId: string): FeedSnapshot | null {
  try {
    if (!userId || typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.posts) || parsed.posts.length === 0) return null;
    if (!parsed.posts.every(isValidPost)) return null;
    if (typeof parsed.savedAt !== 'number' || !Number.isFinite(parsed.savedAt)) return null;
    return {
      posts: parsed.posts,
      hasMore: !!parsed.hasMore,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export function saveFeedSnapshot(userId: string, posts: any[], hasMore: boolean): void {
  try {
    if (!userId || typeof window === 'undefined') return;
    if (!Array.isArray(posts) || posts.length === 0) return;
    const page = posts.slice(0, MAX_POSTS);
    if (!page.every(isValidPost)) return;
    const raw = JSON.stringify({ posts: page, hasMore: !!hasMore, savedAt: Date.now() });
    if (raw.length > MAX_CHARS) {
      // Oversized: drop the snapshot instead of storing it.
      clearFeedSnapshot(userId);
      return;
    }
    window.localStorage.setItem(keyFor(userId), raw);
  } catch {
    // Quota exceeded or storage unavailable (private mode, WebView
    // restrictions): drop the snapshot and carry on without it.
    clearFeedSnapshot(userId);
  }
}

export function clearFeedSnapshot(userId: string): void {
  try {
    if (!userId || typeof window === 'undefined') return;
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    // Best-effort cleanup only.
  }
}

// Removes every stored feed snapshot, whichever account it belongs to.
// Used when the server definitively ends the session (401 from
// /api/auth/me): the dead session's snapshots must not survive to be
// painted under a later login on this device.
export function clearAllFeedSnapshots(): void {
  try {
    if (typeof window === 'undefined') return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    // Best-effort cleanup only.
  }
}
