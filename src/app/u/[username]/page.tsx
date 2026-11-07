import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import ProfileClient from './ProfileClient';

const SITE_URL = 'https://www.frianzo.online';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.frianzo.online';

type Props = { params: Promise<{ username: string }> };

// Server-side fetch with a short timeout. Any failure returns null so the
// page never breaks — ProfileClient then loads the same data in the browser
// exactly as before (fail-soft).
async function fetchJson(url: string, timeoutMs = 6000, extra?: { headers?: Record<string, string>; noStore?: boolean }): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: extra?.headers,
      ...(extra?.noStore ? { cache: 'no-store' } : { next: { revalidate: 300 } }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getPublicProfile(username: string) {
  const result = await fetchJson(`${API_URL}/api/users/${encodeURIComponent(username)}`);
  return result?.success ? result.data?.user ?? null : null;
}

// Public posts for a profile, fetched server-side with NO login — the same
// public endpoint the browser client uses. Only posts marked public are
// passed through, and only for public (non-private) profiles: a private
// profile's posts are never rendered server-side, so nothing leaks that the
// client would hide behind its private view.
async function getPublicProfilePosts(username: string, isPrivate: boolean): Promise<any[]> {
  if (isPrivate) return [];
  const result = await fetchJson(`${API_URL}/api/posts/user/${encodeURIComponent(username)}`);
  const list: any[] = result?.data?.posts ?? [];
  return list
    .filter((p) => p?.visibility === 'public' || p?.visibility == null);
}

async function getPublicProfileReels(username: string, isPrivate: boolean): Promise<any[]> {
  if (isPrivate) return [];
  // The reels endpoint is login-gated (authMiddleware): without a cookie it
  // 401s, so the server seed was always [] and the Reels counter flashed 0
  // on first paint. The auth cookie is scoped to .frianzo.online, so the
  // Next.js server receives it too — forward the visitor's own cookie so a
  // logged-in visitor's first paint already has their reels. This fetch is
  // ALWAYS no-store: the response depends on the cookie, so it must never
  // enter the Data Cache (a cached 401, or one user's reels, must never be
  // served to anyone else). Logged-out visitors still get [] here, exactly
  // as before — their client fetch 401s too, so 0 stays (no flash).
  const cookieStore = await cookies();
  const parts: string[] = [];
  const authToken = cookieStore.get('vynzo_auth_token')?.value;
  const legacyToken = cookieStore.get('vynzo_token')?.value;
  if (authToken) parts.push(`vynzo_auth_token=${authToken}`);
  if (legacyToken) parts.push(`vynzo_token=${legacyToken}`);
  const result = await fetchJson(
    `${API_URL}/api/reels/user/${encodeURIComponent(username)}`,
    6000,
    { headers: parts.length ? { Cookie: parts.join('; ') } : undefined, noStore: true },
  );
  return result?.data?.reels ?? [];
}

async function getFollowCounts(userId: string) {
  const result = await fetchJson(`${API_URL}/api/follows/${encodeURIComponent(userId)}/counts`);
  if (!result?.success) return null;
  return {
    followers: result.data?.followers ?? 0,
    following: result.data?.following ?? 0,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    return {
      title: 'Profile | Frianzo',
      description: 'Frianzo profile page.',
      robots: { index: false, follow: false },
    };
  }

  const displayName = profile.displayName || profile.username || username;
  const handle = profile.username || username;
  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `${displayName} (@${handle}) on Frianzo. Discover posts, photos, reels and updates.`;
  const canonical = `/u/${encodeURIComponent(handle)}`;

  return {
    title: `${displayName} (@${handle})`,
    description,
    alternates: { canonical },
    robots: profile.isPrivate
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: 'profile',
      url: `${SITE_URL}${canonical}`,
      title: `${displayName} (@${handle}) | Frianzo`,
      description,
      siteName: 'Frianzo',
      images: profile.profilePictureUrl
        ? [{ url: profile.profilePictureUrl, alt: `${displayName} profile photo` }]
        : [{ url: '/logo.png', alt: 'Frianzo logo' }],
    },
    twitter: {
      card: 'summary',
      title: `${displayName} (@${handle}) | Frianzo`,
      description,
      images: profile.profilePictureUrl ? [profile.profilePictureUrl] : ['/logo.png'],
    },
  };
}

// Facebook-like: the profile header and the first public posts are rendered
// by the SERVER, so the HTML Google (and any logged-out visitor) receives
// already contains the real name, bio, counts and post text — not an empty
// shell that only fills in after JavaScript runs. ProfileClient still owns
// all interactivity (follow, tabs, comments, editing); it is simply seeded
// with the same data so its first paint is the server content, and it
// refreshes everything in the browser exactly as before.
export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) return <ProfileClient />;

  const [posts, reels, counts] = await Promise.all([
    getPublicProfilePosts(username, !!profile.isPrivate),
    getPublicProfileReels(username, !!profile.isPrivate),
    profile.id ? getFollowCounts(profile.id) : Promise.resolve(null),
  ]);

  return (
    <ProfileClient
      initialProfile={profile}
      initialPosts={posts}
      initialReels={reels}
      initialCounts={counts ?? undefined}
    />
  );
}
