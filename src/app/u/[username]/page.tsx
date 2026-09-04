'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold text-slate-900">@{profile.username}</span>
        {isMe && (
          <Link href="/settings-menu" aria-label="Settings" className="p-2 text-slate-900">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600">
          {profile.displayName?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{profile.displayName}</h1>
          <p className="text-slate-500">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && <p className="mt-4 text-slate-700">{profile.bio}</p>}

      <div className="mt-4 flex gap-6 border-y py-3 text-sm">
        <span><b>{counts.followers}</b> <span className="text-slate-500">Followers</span></span>
        <span><b>{counts.following}</b> <span className="text-slate-500">Following</span></span>
      </div>

      {isMe ? (
        <a
          href="/settings"
          className="mt-4 block rounded-lg border py-2 text-center font-medium text-slate-700"
        >
          Edit Profile
        </a>
      ) : (
        <button
          onClick={handleFollow}
          className={`mt-4 w-full rounded-lg py-2 font-medium ${
            isFollowing ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-white'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}
