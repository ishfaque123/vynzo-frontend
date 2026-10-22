import { cookies } from 'next/headers';
import HomeClient from './HomeClient';
import PublicLanding from '@/components/PublicLanding';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Frianzo - Connect. Share. Discover. | Free Social App',
  description:
    'Frianzo is Pakistan\u2019s free social app for sharing posts, photos, stories and reels, chatting with friends on built-in Messenger, and discovering people. Download free on Google Play.',
  keywords:
    'Frianzo, Frianzo app, social app Pakistan, free social media app, share reels, share photos, chat app, download Frianzo, Pakistani social network',
  openGraph: {
    title: 'Frianzo - Connect. Share. Discover.',
    description:
      'Pakistan\u2019s free social app: posts, reels, stories, Messenger and more. Download free on Google Play.',
    type: 'website',
    url: 'https://www.frianzo.online/',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Frianzo logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'Frianzo - Connect. Share. Discover.',
    description:
      'Pakistan\u2019s free social app: posts, reels, stories, Messenger and more. Download free on Google Play.',
    images: ['/logo.png'],
  },
};

const appStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MobileApplication',
      name: 'Frianzo',
      operatingSystem: 'Android',
      applicationCategory: 'SocialNetworkingApplication',
      downloadUrl: 'https://play.google.com/store/apps/details?id=com.frianzo.app',
      installUrl: 'https://play.google.com/store/apps/details?id=com.frianzo.app',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Organization', name: 'Frianzo', url: 'https://www.frianzo.online' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is Frianzo free?',
          acceptedAnswer: { '@type': 'Answer', text: 'Yes. Frianzo is completely free to download and use.' },
        },
        {
          '@type': 'Question',
          name: 'Where can I download the Frianzo app?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can download the official Frianzo app free on Google Play for Android.',
          },
        },
        {
          '@type': 'Question',
          name: 'What can I do on Frianzo?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Share posts, photos, reels and stories, chat with friends on the built-in Messenger, follow profiles, join conversations, and discover new people through the For You feed.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Frianzo available in my country?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The Frianzo app is available on Google Play in 178 countries.',
          },
        },
      ],
    },
  ],
};

export default async function Page() {
  const store = await cookies();
  const loggedIn = !!(store.get('vynzo_auth_token') || store.get('vynzo_token'));
  if (loggedIn) return <HomeClient />;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appStructuredData) }}
      />
      <PublicLanding />
    </>
  );
}
