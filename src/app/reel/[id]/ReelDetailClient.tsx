'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchReelById } from '@/lib/api/reelApi';
import FeedReelCard from '@/components/FeedReelCard';

// Single-reel page client: renders the reel the server already seeded
// (public fetch, so it works for logged-out viewers too) inside the
// normal feed reel card — video, author, caption, like / comment /
// share all work exactly like in the feed.
export default function ReelDetailClient({ initialReel, reelId }: { initialReel?: any; reelId: string }) {
  const { user } = useAuth();
  const [reel, setReel] = useState<any | null>(initialReel ?? null);

  // Signed-in viewers get the full reel (counts, liked state, boost
  // button) from the authenticated endpoint; logged-out viewers keep
  // the public seed the server already fetched.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchReelById(reelId).then((result) => {
      if (!cancelled && result?.success && result.data?.reel) setReel(result.data.reel);
    });
    return () => {
      cancelled = true;
    };
  }, [user, reelId]);

  if (!reel) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">This reel isn&apos;t available.</p>
        <p className="mt-1 text-sm text-slate-500">It may have been deleted, or the account is private.</p>
        <Link href="/reels" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Watch reels
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-3 py-4">
      <FeedReelCard reel={reel} currentUser={user ?? undefined} />
      <div className="mt-3 text-center">
        <Link href={`/reels?id=${encodeURIComponent(reel.id)}`} className="text-sm font-medium text-blue-600">
          Open in Reels
        </Link>
      </div>
    </main>
  );
}
