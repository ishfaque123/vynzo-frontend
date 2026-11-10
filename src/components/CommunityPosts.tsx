import Link from 'next/link';

// Server-rendered "Latest from the community" for the public landing page.
//
// Why this exists: the landing page a logged-out visitor (and Google's
// AdSense reviewer) sees had no real user content on it at all — only
// marketing copy. The feed itself needs a login, and profile/post pages
// render their content client-side. This section shows real, public posts
// from real public profiles, fetched server-side from the public API
// endpoints (no login needed), so the public site carries genuine content.
//
// Sourcing: top creators from the public leaderboard, then each one's
// public posts. Only posts with real text are shown. Obvious spam is
// filtered out (earn-money schemes, follow-back bait) — this is a
// showcase, not the full feed. Any fetch failure hides the section
// instead of breaking the page.

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.frianzo.online';

const SPAM_MARKERS = [
  'earn money',
  'income',
  'follow back',
  'follow for follow',
  'f4f',
  'lifetime income',
  'double your money',
];

type CommunityPost = {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt?: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string | null;
};

async function fetchJson(url: string, timeoutMs = 6000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getCommunityPosts(): Promise<CommunityPost[]> {
  const board = await fetchJson(
    `${API_URL}/api/users/leaderboard?category=followers&limit=8`,
  );
  const leaders: any[] = board?.data?.leaderboard ?? [];
  const usernames = leaders
    .map((u) => u?.username)
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
    .slice(0, 5);
  if (usernames.length === 0) return [];

  const settled = await Promise.allSettled(
    usernames.map((u) =>
      fetchJson(`${API_URL}/api/posts/user/${encodeURIComponent(u)}`),
    ),
  );

  const posts: CommunityPost[] = [];
  settled.forEach((result, i) => {
    if (result.status !== 'fulfilled' || !result.value) return;
    const list: any[] = result.value?.data?.posts ?? [];
    const leader = leaders[i];
    for (const p of list) {
      if (posts.length >= 12) break;
      const content = String(p?.content ?? '').replace(/\s+/g, ' ').trim();
      if (!content || content.length < 30) continue;
      if (p?.visibility && p.visibility !== 'public') continue;
      const lower = content.toLowerCase();
      if (SPAM_MARKERS.some((m) => lower.includes(m))) continue;
      posts.push({
        id: String(p.id),
        content,
        imageUrl: p?.imageUrl ?? null,
        createdAt: p?.createdAt,
        authorName:
          p?.author?.displayName || leader?.displayName || leader?.username || 'Frianzo user',
        authorUsername:
          p?.author?.username || leader?.username || usernames[i],
        authorAvatar: p?.author?.profilePictureUrl || leader?.avatar || null,
      });
      if (posts.filter((x) => x.authorUsername === usernames[i]).length >= 2) break;
    }
  });

  posts.sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
  );
  return posts.slice(0, 6);
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default async function CommunityPosts() {
  let posts: CommunityPost[] = [];
  try {
    posts = await getCommunityPosts();
  } catch {
    return null;
  }
  if (posts.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
      <p className="text-center text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
        From the community
      </p>
      <h2 className="mt-3 text-center text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        Latest posts on Frianzo
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-slate-600 sm:text-base">
        Real posts from public Frianzo profiles. Open any post to see it in
        the app — or join free and start sharing your own.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              {post.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.authorAvatar}
                  alt=""
                  className="h-10 w-10 rounded-full bg-slate-200 object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {post.authorName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  <Link
                    href={`/u/${encodeURIComponent(post.authorUsername)}`}
                    className="hover:underline"
                  >
                    {post.authorName}
                  </Link>
                </p>
                <p className="truncate text-xs text-slate-500">
                  @{post.authorUsername}
                  {post.createdAt ? ` · ${formatDate(post.createdAt)}` : ''}
                </p>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {post.content.length > 280
                ? `${post.content.slice(0, 280)}…`
                : post.content}
            </p>
            {post.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <div className="mt-3 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-200">
                <img
                  src={post.imageUrl}
                  alt={`Photo shared by ${post.authorName}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
            <p className="mt-4 text-sm font-semibold text-blue-600">
              <Link href={`/post/${encodeURIComponent(post.id)}`}>
                View post →
              </Link>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
