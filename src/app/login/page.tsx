'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { loginWithGoogleToken } from '@/lib/api/authApi';

declare global {
  interface Window {
    handleVynzoCredential: (response: any) => void;
  }
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    window.handleVynzoCredential = (response: any) => {
      setLoading(true);
      setError('');
      loginWithGoogleToken(response.credential)
        .then((result) => {
          if (!result.success) {
            setError(result.error?.message || 'Login failed. Please try again.');
            setLoading(false);
            return;
          }
          router.push(result.data.isNewUser ? '/profile-setup' : '/');
        })
        .catch(() => {
          setError('Something went wrong. Please try again.');
          setLoading(false);
        });
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div
        id="g_id_onload"
        data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        data-callback="handleVynzoCredential"
      />

      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-slate-900">Friendzo</h1>

      {loading && <p className="text-slate-500">Signing you in...</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="g_id_signin" data-type="standard" data-shape="pill" />
    </div>
  );
}
