'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function Avatar({ url, name }: { url?: string; name?: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center text-xs font-semibold text-slate-600" style={url ? { backgroundImage: `url(${url})` } : {}}>
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/posts/${params.id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((result) => { if (result.success) setPost(result.data.post); })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;
  if (!post) return <p className="p-8 text-center text-slate-500">Post not found.</p>;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="border-b py-4">
        <Link href={`/u/${post.author.username}`} className="flex items-center gap-2 font-medium hover:underline">
          <Avatar url={post.author.profilePictureUrl} name={post.author.displayName} />
          {post.author.displayName}
        </Link>
        {post.content && <p className="mt-2 whitespace-pre-wrap">{post.content}</p>}
        {post.imageUrl && <img src={post.imageUrl} alt="" className="mt-2 w-full rounded-lg" />}
      </div>
    </div>
  );
}
