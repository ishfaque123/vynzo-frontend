import type { MetadataRoute } from 'next';
import { articles } from '@/lib/blog';

const SITE_URL = 'https://www.frianzo.online';

async function topCreatorUsernames(): Promise<string[]> {
  // Public creator profiles give Google real user-content URLs to crawl.
  // Fail-soft: any error means only the official profile is listed.
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      'https://api.frianzo.online/api/users/leaderboard?category=followers&limit=5',
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return ['frienzo'];
    const data = await res.json();
    const names = (data?.data?.leaderboard ?? [])
      .map((u: any) => u?.username)
      .filter((u: any): u is string => typeof u === 'string' && u.length > 0);
    return names.length > 0 ? names : ['frienzo'];
  } catch {
    return ['frienzo'];
  }
}

async function topPublicPostIds(): Promise<string[]> {
  // Crawlable per-post permalinks (/post/[id]) for Google: the top
  // creators' recent public posts. Fail-soft: any error means no post
  // URLs are listed (profiles above still are).
  try {
    const creators = await topCreatorUsernames();
    const settled = await Promise.allSettled(
      creators.slice(0, 5).map(async (username) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(
            `https://api.frianzo.online/api/posts/user/${encodeURIComponent(username)}`,
            { signal: controller.signal },
          );
          if (!res.ok) return [];
          const data = await res.json();
          const list: any[] = data?.data?.posts ?? [];
          return list
            .filter(
              (p) =>
                p?.id &&
                p?.visibility === 'public' &&
                (String(p?.content ?? '').trim().length >= 30 || p?.imageUrl),
            )
            .slice(0, 3)
            .map((p) => String(p.id));
        } catch {
          return [];
        } finally {
          clearTimeout(timer);
        }
      }),
    );
    const ids: string[] = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') ids.push(...result.value);
    }
    return [...new Set(ids)].slice(0, 15);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const creators = await topCreatorUsernames();
  const postIds = await topPublicPostIds();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/help`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/child-safety`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/community-guidelines`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...articles.map((a) => ({
      url: `${SITE_URL}/blog/${a.slug}`,
      lastModified: new Date(`${a.date}T00:00:00Z`),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...creators.map((username) => ({
      url: `${SITE_URL}/u/${encodeURIComponent(username)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
    ...postIds.map((id) => ({
      url: `${SITE_URL}/post/${encodeURIComponent(id)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ];
}
