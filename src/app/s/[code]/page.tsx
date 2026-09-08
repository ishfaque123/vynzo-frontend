'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { resolveShareLink } from '@/lib/api/shareApi';

export default function ShareRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    resolveShareLink(code).then((result) => {
      if (result.success) {
        if (result.data.type === 'profile') router.replace(`/u/${result.data.username}`);
        else router.replace(`/post/${result.data.postId}`);
      } else {
        setNotFound(true);
      }
    });
  }, [code, router]);

  if (notFound) return <p className="p-8 text-center text-slate-500">This link is invalid or has expired.</p>;
  return <p className="p-8 text-center text-slate-500">Redirecting...</p>;
}
