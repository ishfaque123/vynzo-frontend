import type { Metadata } from 'next';
import PostDetailClient from './PostDetailClient';

const SITE_URL = 'https://www.frianzo.online';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.frianzo.online';

type Props = { params: Promise<{ id: string }> };

async function getPublicPost(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/posts/${encodeURIComponent(id)}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result?.success ? result.data?.post ?? null : null;
  } catch {
    return null;
  }
}

function cleanDescription(value: unknown) {
  return String(value || '').replace(/\\s+/g, ' ').trim().slice(0, 160);
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

export default function PostDetailPage() {
  return <PostDetailClient />;
}
