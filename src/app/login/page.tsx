'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.9 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2 1.5-4.7 2.4-7.7 2.4-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.5 36.1 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function FriendzoLogo() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 shadow-sm">
        <span className="text-2xl font-bold text-white">F</span>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Friendzo</h1>
      <p className="mt-1 text-sm text-slate-500">Share your moments with friends</p>
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const isSwitching = searchParams.get('switch') === '1';
  const hasError = searchParams.get('error') === 'google_auth_failed';
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const loginUrl = `${API_URL}/api/auth/google/start${isSwitching ? '?switch=1' : ''}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm">
        <FriendzoLogo />

        {hasError && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">
            Login failed. Please try again.
          </p>
        )}
        {isSwitching && (
          <p className="mt-6 rounded-lg bg-slate-100 px-4 py-2.5 text-center text-sm text-slate-600">
            Choose a different Google account to continue.
          </p>
        )}

        <a
          href={loginUrl}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow"
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
          By continuing, you agree to Friendzo&apos;s{' '}
          <a href="/terms" className="font-medium text-slate-500 hover:underline">
            Terms of Service
          </a>{' '}
          and acknowledge our{' '}
          <a href="/privacy" className="font-medium text-slate-500 hover:underline">
            Privacy Policy
          </a>
          .
        </p>

        <div className="mt-8 flex justify-center gap-4 text-xs text-slate-400">
          <a href="/about" className="hover:underline">About</a>
          <span>·</span>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
      </div>
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
