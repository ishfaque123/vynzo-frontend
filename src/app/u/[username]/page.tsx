'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchUserProfile, fetchFollowCounts, toggleFollow } from '@/lib/api/userApi';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile(username).then((result) => {
      if (result.success) {
        setProfile(result.data.user);
        fetchFollowCounts(result.data.user.id).then((c) => {
          if (c.success) setCounts(c.data);
        });
      }
      setLoading(false);
    });
  }, [username]);

  async function handleFollow() {
    if (!profile) return;
    const result = await toggleFollow(profile.id);
    if (result.success) {
      setIsFollowing(result.data.following);
      setCounts((prev) => ({
        ...prev,
        followers: prev.followers + (result.data.following ? 1 : -1),
      }));
    }
  }

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;
  if (!profile) return <p className="p-8 text-center text-slate-500">User not found.</p>;

  const isMe = currentUser?.username === profile.username;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{profile.displayName}</h1>
      <p className="text-slate-500">@{profile.username}</p>
      {profile.bio && <p className="mt-2">{profile.bio}</p>}

      <div className="mt-4 flex gap-4 text-sm text-slate-600">
        <span><b>{counts.followers}</b> Followers</span>
        <span><b>{counts.following}</b> Following</span>
      </div>

      {!isMe && (
        <button
          onClick={handleFollow}
          className={`mt-4 rounded-lg px-4 py-2 ${
            isFollowing ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-white'
          }`}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );
}
