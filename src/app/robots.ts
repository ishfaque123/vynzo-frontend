import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.frianzo.online';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
      {
        userAgent: 'AdsBot-Google',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/compose',
          '/login',
          '/messages',
          '/notifications',
          '/profile-setup',
          '/search',
          '/settings',
          '/settings-menu',
          '/reels',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
