import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

const SITE_URL = 'https://www.frianzo.online';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.frianzo.online';

type Props = { params: Promise<{ username: string }> };

async function getPublicProfile(username: string) {
  try {
    const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(username)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result?.success ? result.data?.user ?? null : null;
  } catch {
    return null;
  }
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

export default function ProfilePage() {
  return <ProfileClient />;
}
