'use client';

import { useAuth } from '@/lib/auth/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Welcome to Vynzo, {user.displayName}</h1>
      <p className="mt-2 text-slate-500">Home feed will be built in a later stage.</p>
    </div>
  );
}
