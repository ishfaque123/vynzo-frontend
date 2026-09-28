'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Inside the Android app there is no marketing landing page: a logged-out
// user goes straight to the login form.
export default function NativeRedirect() {
  const router = useRouter();
  useEffect(() => {
    if ((window as any).FrianzoNative) router.replace('/login');
  }, [router]);
  return null;
}
