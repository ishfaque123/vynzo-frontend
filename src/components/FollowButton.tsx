'use client';

import { useState } from 'react';
import { toggleFollow } from '@/lib/api/userApi';

export default function FollowButton({ userId, status: initialStatus }: { userId: string; status: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  if (status === 'self' || status === 'friends') {
    return status === 'friends' ? <span className="text-xs font-medium text-slate-500">• Friends</span> : null;
  }

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

  if (status === 'following') return null;

  return (
    <button onClick={handleClick} disabled={loading} className="text-xs font-semibold text-blue-600 disabled:opacity-50">
      {status === 'follow_back' ? 'Follow Back' : 'Follow'}
    </button>
  );
}
