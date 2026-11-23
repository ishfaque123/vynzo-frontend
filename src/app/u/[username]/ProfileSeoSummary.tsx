const SITE_URL = 'https://www.frianzo.online';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.frianzo.online';

// Server-rendered, screen-reader and crawler readable summary of a public
// profile. It is rendered inside a <Suspense> boundary by the profile page,
// so it streams in AFTER the page shell — the visible profile keeps its
// cache-first paint and never waits for these requests. Any failure (slow
// API, missing profile, private account) renders nothing at all, and the
// page behaves exactly as it did before this component existed.
//
// Privacy: only data the public API already returns to an unauthenticated
// visitor is used — display name, username, bio, profile photo and the
// follower / following / public-post counts. Locked profile fields (phone,
// email and the other per-field private details) are never sent by that API
// and are never read here.

async function fetchJson(url: string, timeoutMs = 3000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isPublicPost(post: any) {
  return !post?.visibility || post.visibility === 'public';
}

function formatDate(value: unknown) {
  const date = new Date(String(value || ''));
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function cleanCaption(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 300);
}

export default async function ProfileSeoSummary({ username }: { username: string }) {
  const [profileResult, postsResult] = await Promise.all([
    fetchJson(`${API_URL}/api/users/${encodeURIComponent(username)}`),
    fetchJson(`${API_URL}/api/posts/user/${encodeURIComponent(username)}`),
  ]);

  const profile = profileResult?.success ? profileResult.data?.user ?? null : null;
  if (!profile || profile.isPrivate) return null;

  const posts = postsResult?.success && Array.isArray(postsResult.data?.posts)
    ? postsResult.data.posts
    : null;
  const publicPosts = (posts ?? []).filter(isPublicPost);
  const recentPosts = publicPosts.slice(0, 5);

  const displayName = profile.displayName || profile.username || username;
  const handle = profile.username || username;
  const bio = String(profile.bio || '').trim();
  const profileUrl = `${SITE_URL}/u/${encodeURIComponent(handle)}`;
  const joinedDate = formatDate(profile.createdAt);

  const countParts: string[] = [];
  if (typeof profile.followersCount === 'number') {
    countParts.push(`${profile.followersCount} Followers`);
  }
  if (typeof profile.followingCount === 'number') {
    countParts.push(`${profile.followingCount} Following`);
  }
  // The post count is only stated when the posts request actually
  // succeeded — an unknown count is never guessed.
  if (posts) countParts.push(`${publicPosts.length} Posts`);

  const interactionStatistic = [
    typeof profile.followersCount === 'number'
      ? {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/FollowAction',
          name: 'Followers',
          userInteractionCount: profile.followersCount,
        }
      : null,
    typeof profile.followingCount === 'number'
      ? {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/FollowAction',
          name: 'Following',
          userInteractionCount: profile.followingCount,
        }
      : null,
  ].filter(Boolean);

  const person: Record<string, unknown> = {
    '@type': 'Person',
    name: displayName,
    alternateName: `@${handle}`,
    url: profileUrl,
  };
  if (bio) person.description = bio;
  if (profile.profilePictureUrl) person.image = String(profile.profilePictureUrl);
  if (interactionStatistic.length) person.interactionStatistic = interactionStatistic;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: person,
  };

  return (
    <>
      <section className="sr-only" aria-label={`About ${displayName}`}>
        <h1>
          {displayName} (@{handle})
        </h1>
        {bio ? <p>{bio}</p> : null}
        {countParts.length ? <p>{countParts.join(' · ')}</p> : null}
        {joinedDate ? <p>Joined {joinedDate}</p> : null}
        {recentPosts.length ? (
          <>
            <h2>Recent posts by {displayName}</h2>
            <ul>
              {recentPosts.map((post: any) => {
                const text = cleanCaption(post.content || post.caption);
                const date = formatDate(post.createdAt);
                return (
                  <li key={String(post.id)}>
                    <a href={`/post/${encodeURIComponent(String(post.id))}`}>
                      {text || 'Photo post'}
                    </a>
                    {date ? (
                      <>
                        {' — '}
                        <time dateTime={String(post.createdAt)}>{date}</time>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </>
  );
}
