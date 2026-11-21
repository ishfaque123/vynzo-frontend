import type { Metadata } from 'next';
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

// The page shell returns immediately — no data fetches wait here.
// Seeding the body from the server made every profile tap wait for the
// slowest API call before anything could paint (1-2s of skeleton or a
// blank screen in the app). ProfileClient now owns the paint: it shows
// the viewer's saved copy of the profile instantly (session cache, then
// the on-device copy) and refreshes quietly in the background, exactly
// like Facebook. Only the metadata above still fetches server-side, so
// shared profile links keep their proper title, description and photo.
export default async function ProfilePage({ params }: Props) {
  await params;
  return <ProfileClient />;
}
