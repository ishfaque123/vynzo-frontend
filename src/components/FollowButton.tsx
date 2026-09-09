'use client';

import { useState } from 'react';
import { toggleFollow } from '@/lib/api/userApi';

export default function FollowButton({ userId, status: initialStatus }: { userId: string; status: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  if (status === 'self') return null;
  if (status === 'friends') return <span className="text-xs font-medium text-slate-500">• Friends</span>;

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
  const colorClass = status === 'following' ? 'text-slate-500' : 'text-blue-600';

  return (
    <button onClick={handleClick} disabled={loading} className={`text-xs font-semibold disabled:opacity-50 ${colorClass}`}>
      {label}
    </button>
  );
}
