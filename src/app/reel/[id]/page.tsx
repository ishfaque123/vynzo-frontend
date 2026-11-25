import type { Metadata } from 'next';
import ReelDetailClient from './ReelDetailClient';

const SITE_URL = 'https://www.frianzo.online';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.frianzo.online';

type Props = { params: Promise<{ id: string }> };

async function fetchJson(url: string, timeoutMs = 6000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 120 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Public single-reel fetch — no login, so WhatsApp / Telegram /
// Facebook crawlers can read it too. The backend enforces the rule:
// only a reel whose author is NOT private is returned, anything else
// is a 404. The page below never sees private content.
async function getPublicReel(id: string) {
  const result = await fetchJson(`${API_URL}/api/reels/${encodeURIComponent(id)}/public`);
  return result?.success ? result.data?.reel ?? null : null;
}

// A reel is only server-rendered when the public endpoint returns it.
// Anything else is left to ReelDetailClient, which fetches with the
// viewer's own credentials — so no private content can leak into the
// public HTML. Fail closed: if the author check fails, do not seed.
async function getSeedableReel(id: string) {
  const reel = await getPublicReel(id);
  if (!reel) return null;
  if (reel.author?.isPrivate) return null;
  return reel;
}

function cleanDescription(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function formatReelDate(value: unknown) {
  const date = new Date(String(value || ''));
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function firstCaptionLine(value: unknown) {
  const line = String(value || '')
    .split(/\r?\n/)
    .map((part) => part.trim())
    .find(Boolean);
  return (line || '').slice(0, 120);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const reel = await getPublicReel(id);

  if (!reel) {
    return {
      title: 'Reel | Frianzo',
      description: 'Watch a reel on Frianzo.',
      robots: { index: false, follow: false },
    };
  }

  const authorName = reel.author?.displayName || reel.author?.username || 'Frianzo user';
  const description =
    cleanDescription(reel.caption) || `Watch this reel by ${authorName} on Frianzo.`;
  const title = `${authorName} on Frianzo`;

  return {
    title,
    description,
    alternates: { canonical: `/reel/${encodeURIComponent(id)}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'video.other',
      url: `${SITE_URL}/reel/${encodeURIComponent(id)}`,
      title,
      description,
      siteName: 'Frianzo',
      images: reel.thumbnailUrl
        ? [{ url: reel.thumbnailUrl, alt: `Reel by ${authorName}` }]
        : [{ url: '/logo.png', alt: 'Frianzo logo' }],
      videos: reel.videoUrl ? [{ url: reel.videoUrl, type: 'video/mp4' }] : undefined,
    },
    twitter: {
      card: reel.thumbnailUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: reel.thumbnailUrl ? [reel.thumbnailUrl] : ['/logo.png'],
    },
  };
}

// A screen-reader and crawler readable copy of the reel, rendered by the
// server from the SAME reel object the page already fetched — no extra
// request, no extra wait. The visible card below shows exactly this data
// once it paints; this block only guarantees the initial HTML carries the
// caption, the author's name and username, the publication date and the
// thumbnail, plus matching structured data.
// It renders only for seedable reels (public reel, public author), so no
// private content can appear here.
function ReelSeoSummary({ reel, id }: { reel: any; id: string }) {
  const caption = String(reel.caption || '').trim();
  const authorName = reel.author?.displayName || reel.author?.username || 'Frianzo user';
  const authorUsername = reel.author?.username ? String(reel.author.username) : '';
  const authorUrl = authorUsername
    ? `${SITE_URL}/u/${encodeURIComponent(authorUsername)}`
    : SITE_URL;
  const reelUrl = `${SITE_URL}/reel/${encodeURIComponent(id)}`;
  const headline = firstCaptionLine(caption) || `Reel by ${authorName}`;
  const publishedDate = formatReelDate(reel.createdAt);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: headline,
    url: reelUrl,
    mainEntityOfPage: reelUrl,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUsername ? { alternateName: `@${authorUsername}`, url: authorUrl } : {}),
    },
  };
  if (caption) jsonLd.description = caption;
  if (reel.createdAt) jsonLd.uploadDate = String(reel.createdAt);
  if (reel.thumbnailUrl) jsonLd.thumbnailUrl = [String(reel.thumbnailUrl)];
  if (reel.videoUrl) jsonLd.contentUrl = String(reel.videoUrl);

  return (
    <>
      <article className="sr-only">
        <h1>{headline}</h1>
        <p>
          By{' '}
          <a href={authorUrl}>
            {authorName}
            {authorUsername ? ` (@${authorUsername})` : ''}
          </a>
        </p>
        {publishedDate ? (
          <p>
            Published on <time dateTime={String(reel.createdAt)}>{publishedDate}</time>
          </p>
        ) : null}
        {caption ? <p>{caption}</p> : null}
        {reel.thumbnailUrl ? <img src={String(reel.thumbnailUrl)} alt={headline} /> : null}
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </>
  );
}

// Facebook-like: the reel content and its author are rendered by the
// SERVER, so the HTML a link preview crawler receives already contains
// the real caption, author and thumbnail — not an empty shell that only
// fills in after JavaScript runs. ReelDetailClient still owns all
// interactivity (like, comments, share); it is seeded with the same
// reel and refreshes it in the browser exactly as before.
export default async function ReelDetailPage({ params }: Props) {
  const { id } = await params;
  const reel = await getSeedableReel(id);
  return (
    <>
      {reel ? <ReelSeoSummary reel={reel} id={id} /> : null}
      <ReelDetailClient initialReel={reel ?? undefined} reelId={id} />
    </>
  );
}
