import './globals.css';
import { headers } from 'next/headers';
import type { Metadata, Viewport } from 'next';
import Shell from '@/components/Shell';
import ThemeProvider from '@/components/ThemeProvider';
import { FollowProvider } from '@/contexts/FollowContext';
import OfflineServiceWorker from '@/components/OfflineServiceWorker';
import { AdsterraSocialBar } from '@/components/Adsterra';
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Play Data Safety ("No data shared with third parties"): the AdSense
  // loader below must NEVER be sent to the Android app's WebView, or the
  // app would still share Device IDs with Google for advertising. It is
  // therefore omitted server-side, per request, for Android WebView
  // requests only — detected by the standard "; wv" WebView UA marker
  // (the same marker src/app/page.tsx already uses). A client-side check
  // would be too late: the browser fetches an async <script> as soon as
  // it is parsed, before React hydration could remove it. Web browsers
  // and Google's AdSense crawler do not carry "; wv", so they still get
  // the script in served HTML exactly as before. Reading headers() makes
  // this layout dynamic (per-request) rather than statically prerendered.
  const userAgent = (await headers()).get('user-agent') || '';
  const isAppWebView = userAgent.includes('; wv');
  return (
    <html lang="en">
      <head>
        <script
          // Render-blocking theme init: applies the `dark` class before first
          // paint so cold starts never flash a white page. Mirrors
          // ThemeProvider's logic (localStorage `vynzo_theme`, else the OS
          // color-scheme preference). ThemeProvider's own effect is
          // idempotent with this.
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('vynzo_theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();",
          }}
        />
        {!isAppWebView && (
          <script
            // Google AdSense site-verification / loader script. This MUST live
            // in the root layout <head> so it is present in the served HTML of
            // every page (including the homepage). It previously existed only
            // inside <AdUnit>, which loads it client-side via next/script and
            // renders only inside the logged-in feed — so Google's review
            // crawler never found the code in the site's HTML and rejected the
            // site. Do not move this back into a component, and do not
            // remove the isAppWebView gate: it is what keeps the app from
            // sharing data with Google for advertising (Play Data Safety).
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8689135580842158"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>
        <OfflineServiceWorker />
        <ThemeProvider>
          <FollowProvider>
            <Shell>{children}</Shell>
          </FollowProvider>
        </ThemeProvider>
        {/* Adsterra Social Bar slot (placement 31872374) — SEPARATE from the
            AdSense loader in <head> above; do not merge the two. This slot
            renders nothing until the real snippet is pasted into
            src/lib/adsterraSnippets.ts, and the component itself restricts
            the bar to public routes (/, /blog, /about, /help) so it can
            never appear on chat/DM or other logged-in app screens. */}
        <AdsterraSocialBar />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
