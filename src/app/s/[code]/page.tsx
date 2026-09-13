import { redirect } from 'next/navigation';

interface SharePageProps {
  params: Promise<{ code: string }>;
}

export default async function ShareRedirectPage({ params }: SharePageProps) {
  const { code } = await params;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${API_URL}/api/share/${code}`, { cache: 'no-store' });
  const result = await res.json();

  if (!result.success) {
    return <p className="p-8 text-center text-slate-500">This link is invalid or has expired.</p>;
  }

  if (result.data.type === 'profile') {
    redirect(`/u/${result.data.username}`);
  }
  if (result.data.type === 'reel') {
    // No single-reel deep-link page yet — lands them in the reels feed.
    redirect('/reels');
  }
  redirect(`/post/${result.data.postId}`);
}
