import './globals.css';
import type { Metadata, Viewport } from 'next';
import Shell from '@/components/Shell';
import ThemeProvider from '@/components/ThemeProvider';
import { FollowProvider } from '@/contexts/FollowContext';
import OfflineServiceWorker from '@/components/OfflineServiceWorker';
import AppReadySignal from '@/components/AppReadySignal';
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
        <script
          // Boot watchdog (2026-11-18 blank-screen fix): if the app bundle
          // fails to boot — e.g. a phone WebView still holds a stale cached
          // shell whose script chunks no longer exist after a deploy — the
          // page renders as an empty dark screen and never recovers (the
          // native app's load-error page only covers network failures, and
          // its loading overlay hides on onPageFinished). This inline script
          // is not part of the bundle, so it still runs in that state: after
          // 12s, if the body has no text and almost no elements, it clears
          // the service worker + caches and reloads ONCE per session.
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{setTimeout(function(){try{var KEY='frianzo_boot_heal';if(sessionStorage.getItem(KEY))return;var text=document.body?(document.body.innerText||'').trim():'';if(text.length>0)return;if(document.querySelectorAll('body *').length>10)return;sessionStorage.setItem(KEY,'1');var done=false;var go=function(){if(done)return;done=true;try{location.reload();}catch(e){}};var tasks=[];if('serviceWorker' in navigator){tasks.push(navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.unregister();}));}).catch(function(){}));}if(window.caches&&caches.keys){tasks.push(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k);}));}).catch(function(){}));}if(tasks.length){Promise.all(tasks).then(go,go);setTimeout(go,1500);}else{go();}}catch(e){}},12000);}catch(e){}})();",
          }}
        />
        <script
          // Google AdSense site-verification / loader script. This MUST live
          // in the root layout <head> so it is present in the served HTML of
          // every page (including the homepage). It previously existed only
          // inside <AdUnit>, which loads it client-side via next/script and
          // renders only inside the logged-in feed — so Google's review
          // crawler never found the code in the site's HTML and rejected the
          // site. Do not move this back into a component.
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8689135580842158"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <OfflineServiceWorker />
        <AppReadySignal />
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
