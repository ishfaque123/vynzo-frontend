import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProfileClient from './ProfileClient';
import ProfileSeoSummary from './ProfileSeoSummary';

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

function isPublicPost(post: any) {
  return !post?.visibility || post.visibility === 'public';
}

// The user's posts list, or null when the request failed. Callers fail
// open on null: an unknown post count must never change how a profile is
// indexed. A short timeout keeps metadata generation fast; the response
// is cached and shared with the streamed profile summary below.
async function getPublicUserPosts(username: string) {
  const result = await fetchJson(
    `${API_URL}/api/posts/user/${encodeURIComponent(username)}`,
    3000,
  );
  if (!result?.success) return null;
  return Array.isArray(result.data?.posts) ? result.data.posts : null;
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

  let robots: Metadata['robots'] = profile.isPrivate
    ? { index: false, follow: false }
    : { index: true, follow: true };

  // Thin-profile rule: a public profile with no bio and no public posts
  // gives a search engine nothing to read, so it stays out of the index
  // (its links are still followed). The check fails open — when the posts
  // request fails, the profile keeps its normal indexing instead of
  // disappearing from search on a temporary error.
  if (!profile.isPrivate && !String(profile.bio || '').trim()) {
    const posts = await getPublicUserPosts(username);
    if (posts && posts.filter(isPublicPost).length === 0) {
      robots = { index: false, follow: true };
    }
  }

  return {
    title: `${displayName} (@${handle})`,
    description,
    alternates: { canonical },
    robots,
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

// The page shell returns immediately — no data fetches wait here.
// Seeding the body from the server made every profile tap wait for the
// slowest API call before anything could paint (1-2s of skeleton or a
// blank screen in the app). ProfileClient now owns the paint: it shows
// the viewer's saved copy of the profile instantly (session cache, then
// the on-device copy) and refreshes quietly in the background, exactly
// like Facebook. Only the metadata above still fetches server-side, so
// shared profile links keep their proper title, description and photo.
//
// The only addition is ProfileSeoSummary inside a Suspense boundary: it
// streams in after the shell with a screen-reader and crawler readable
// summary of the public profile (name, bio, counts, recent public post
// captions) plus structured data. It cannot delay the shell or the first
// paint, and when its requests fail it renders nothing.
export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  return (
    <>
      <ProfileClient />
      <Suspense fallback={null}>
        <ProfileSeoSummary username={username} />
      </Suspense>
    </>
  );
}
