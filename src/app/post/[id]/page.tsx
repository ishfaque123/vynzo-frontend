import type { Metadata } from 'next';
import PostDetailClient from './PostDetailClient';

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

async function getPublicPost(id: string) {
  const result = await fetchJson(`${API_URL}/api/posts/${encodeURIComponent(id)}`);
  return result?.success ? result.data?.post ?? null : null;
}

// A post is only server-rendered when it is public AND its author is not a
// private account. Anything else is left to PostDetailClient, which fetches
// with the viewer's own credentials — so no private content can leak into
// the public HTML. Fail closed: if the author check fails, do not seed.
async function getSeedablePost(id: string) {
  const post = await getPublicPost(id);
  if (!post) return null;
  if (post.visibility && post.visibility !== 'public') return null;
  const authorUsername = post.author?.username;
  if (!authorUsername) return null;
  const authorResult = await fetchJson(`${API_URL}/api/users/${encodeURIComponent(authorUsername)}`);
  const author = authorResult?.success ? authorResult.data?.user ?? null : null;
  if (!author || author.isPrivate) return null;
  return post;
}

function cleanDescription(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function formatPostDate(value: unknown) {
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
  const post = await getPublicPost(id);

  if (!post) {
    return {
      title: 'Post | Frianzo',
      description: 'View a post on Frianzo.',
      robots: { index: false, follow: false },
    };
  }

  // Non-public posts (friends-only, private, ...) must stay out of the
  // index — Google cannot read them, and their text is never seeded into
  // the page below.
  if (post.visibility && post.visibility !== 'public') {
    return {
      title: 'Post | Frianzo',
      description: 'View a post on Frianzo.',
      robots: { index: false, follow: false },
    };
  }

  const authorName = post.author?.displayName || post.author?.username || 'Frianzo user';
  const authorUsername = post.author?.username;
  const description = cleanDescription(post.content || post.caption) ||
    `A post by ${authorName} on Frianzo.`;
  const title = `${authorName} on Frianzo`;

  return {
    title,
    description,
    alternates: { canonical: `/post/${encodeURIComponent(id)}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/post/${encodeURIComponent(id)}`,
      title,
      description,
      siteName: 'Frianzo',
      images: post.imageUrl
        ? [{ url: post.imageUrl, alt: `Post by ${authorName}` }]
        : [{ url: '/logo.png', alt: 'Frianzo logo' }],
      authors: authorUsername ? [`${SITE_URL}/u/${encodeURIComponent(authorUsername)}`] : undefined,
    },
    twitter: {
      card: post.imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: post.imageUrl ? [post.imageUrl] : ['/logo.png'],
    },
  };
}

// A screen-reader and crawler readable copy of the post, rendered by the
// server from the SAME post object the page already fetched — no extra
// request, no extra wait. The visible card below shows exactly this data
// once it paints; this block only guarantees the initial HTML carries the
// full caption, the author's name and username, the publication date and
// the engagement counts as plain text, plus matching structured data.
// It renders only for seedable posts (public post, public author), so no
// private content can appear here.
function PostSeoSummary({ post, id }: { post: any; id: string }) {
  const caption = String(post.content || post.caption || '').trim();
  const authorName = post.author?.displayName || post.author?.username || 'Frianzo user';
  const authorUsername = post.author?.username ? String(post.author.username) : '';
  const authorUrl = authorUsername
    ? `${SITE_URL}/u/${encodeURIComponent(authorUsername)}`
    : SITE_URL;
  const postUrl = `${SITE_URL}/post/${encodeURIComponent(id)}`;
  const headline = firstCaptionLine(caption) || `Post by ${authorName}`;
  const publishedDate = formatPostDate(post.createdAt);

  const countParts: string[] = [];
  if (typeof post.likeCount === 'number') countParts.push(`${post.likeCount} reactions`);
  if (typeof post.commentCount === 'number') countParts.push(`${post.commentCount} comments`);
  if (typeof post.shareCount === 'number') countParts.push(`${post.shareCount} shares`);

  const interactionStatistic = [
    typeof post.likeCount === 'number'
      ? {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: post.likeCount,
        }
      : null,
    typeof post.commentCount === 'number'
      ? {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/CommentAction',
          userInteractionCount: post.commentCount,
        }
      : null,
    typeof post.shareCount === 'number'
      ? {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/ShareAction',
          userInteractionCount: post.shareCount,
        }
      : null,
  ].filter(Boolean);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline,
    url: postUrl,
    mainEntityOfPage: postUrl,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUsername ? { alternateName: `@${authorUsername}`, url: authorUrl } : {}),
    },
  };
  if (caption) jsonLd.articleBody = caption;
  if (post.createdAt) jsonLd.datePublished = String(post.createdAt);
  if (post.imageUrl) jsonLd.image = [String(post.imageUrl)];
  if (interactionStatistic.length) jsonLd.interactionStatistic = interactionStatistic;

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
            Published on <time dateTime={String(post.createdAt)}>{publishedDate}</time>
          </p>
        ) : null}
        {caption ? <p>{caption}</p> : null}
        {post.imageUrl ? <img src={String(post.imageUrl)} alt={headline} /> : null}
        {countParts.length ? <p>{countParts.join(' · ')}</p> : null}
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </>
  );
}

// Facebook-like: the post content and its author are rendered by the SERVER,
// so the HTML Google receives already contains the real post text — not an
// empty shell that only fills in after JavaScript runs. PostDetailClient
// still owns all interactivity (reactions, comments, share); it is seeded
// with the same post and refreshes it in the browser exactly as before.
export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const post = await getSeedablePost(id);
  return (
    <>
      {post ? <PostSeoSummary post={post} id={id} /> : null}
      <PostDetailClient initialPost={post ?? undefined} />
    </>
  );
}
