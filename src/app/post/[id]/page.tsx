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

// Facebook-like: the post content and its author are rendered by the SERVER,
// so the HTML Google receives already contains the real post text — not an
// empty shell that only fills in after JavaScript runs. PostDetailClient
// still owns all interactivity (reactions, comments, share); it is seeded
// with the same post and refreshes it in the browser exactly as before.
export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const post = await getSeedablePost(id);
  return <PostDetailClient initialPost={post ?? undefined} />;
}
