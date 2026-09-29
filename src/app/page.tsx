import { cookies } from 'next/headers';
import HomeClient from './HomeClient';
import PublicLanding from '@/components/PublicLanding';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Frianzo - Connect. Share. Discover.',
  description:
    'Frianzo is a social platform for sharing posts, photos, stories and reels, discovering people, following profiles and joining conversations.',
};

export default async function Page() {
  const store = await cookies();
  const loggedIn = !!(store.get('vynzo_auth_token') || store.get('vynzo_token'));
  return loggedIn ? <HomeClient /> : <PublicLanding />;
}
