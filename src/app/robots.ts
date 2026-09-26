import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.frianzo.online';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/compose',
          '/login',
          '/messages/',
          '/notifications',
          '/profile-setup',
          '/search',
          '/settings/',
          '/settings-menu/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
