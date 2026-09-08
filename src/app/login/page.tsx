'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const isSwitching = searchParams.get('switch') === '1';
  const hasError = searchParams.get('error') === 'google_auth_failed';
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const loginUrl = `${API_URL}/api/auth/google/start${isSwitching ? '?switch=1' : ''}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-slate-900">Vynzo</h1>

      {hasError && (
        <p className="mb-4 text-sm text-red-600">Login failed. Please try again.</p>
      )}
      {isSwitching && (
        <p className="mb-4 text-sm text-slate-500">Choose a different Google account to continue.</p>
      )}

      <a
        href={loginUrl}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        Continue with Google
      </a>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50" />}>
      <LoginForm />
    </Suspense>
  );
}
