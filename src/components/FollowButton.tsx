'use client';

import { useState } from 'react';
import { toggleFollow } from '@/lib/api/userApi';
import { useFollowStatus } from '@/contexts/FollowContext';

export default function FollowButton({ userId, status: initialStatus }: { userId: string; status: string }) {
  const { status, setStatus } = useFollowStatus(userId, initialStatus);
  const [loading, setLoading] = useState(false);

  if (status === 'self') return null;
  if (status === 'friends') return <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[13px] font-semibold text-emerald-700">✓ Friends</span>;

  async function handleClick() {
    setLoading(true);
    const result = await toggleFollow(userId);
    setLoading(false);
    if (result.success) {
      if (result.data.following) {
        setStatus(status === 'follow_back' ? 'friends' : 'following');
      } else {
        setStatus('none');
      }
    } else if (result.error?.code === 'FRIEND_LIMIT_REACHED') {
      alert('Friend limit of 5,000 reached.');
    }
  }

  const label = status === 'following' ? 'Following' : status === 'follow_back' ? 'Follow Back' : 'Follow';
  const pillClass =
    status === 'following'
      ? 'border border-slate-200 bg-slate-100 text-slate-600'
      : status === 'follow_back'
        ? 'bg-slate-900 text-white'
        : 'border border-slate-300 bg-transparent text-slate-900';

  return (
    <button onClick={handleClick} disabled={loading} className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold disabled:opacity-50 ${pillClass}`}>
      {label}
    </button>
  );
}
