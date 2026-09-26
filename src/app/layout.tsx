import './globals.css';
import type { Metadata, Viewport } from 'next';
import Shell from '@/components/Shell';
import ThemeProvider from '@/components/ThemeProvider';
import { FollowProvider } from '@/contexts/FollowContext';
import OfflineServiceWorker from '@/components/OfflineServiceWorker';
import { fetchSeoSettings } from '@/lib/api/settingsApi';

const SITE_URL = 'https://www.frianzo.online';
const SITE_NAME = 'Frianzo';
const DEFAULT_TITLE = 'Frianzo - Social Network to Connect, Share & Discover';
const DEFAULT_DESCRIPTION =
  'Frianzo is a social network for sharing posts, photos, stories and reels, discovering people, following profiles, and connecting through comments and messages.';
const DEFAULT_KEYWORDS =
  'Frianzo, social network, social media, share photos, share posts, stories, reels, connect with friends, discover people';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSeoSettings();

  const title = settings?.seoTitle || DEFAULT_TITLE;
  const description = settings?.seoDescription || DEFAULT_DESCRIPTION;
  const keywords = settings?.seoKeywords || DEFAULT_KEYWORDS;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: '%s | Frianzo',
    },
    description,
    keywords,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: './',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    icons: {
      icon: [{ url: '/icon.png', type: 'image/png' }],
      apple: [{ url: '/icon.png' }],
    },
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: SITE_NAME,
      title,
      description,
      locale: 'en_US',
      images: [
        {
          url: '/logo.png',
          width: 512,
          height: 512,
          alt: 'Frianzo logo',
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ['/logo.png'],
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#2563eb',
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OfflineServiceWorker />
        <ThemeProvider>
          <FollowProvider>
            <Shell>{children}</Shell>
          </FollowProvider>
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
