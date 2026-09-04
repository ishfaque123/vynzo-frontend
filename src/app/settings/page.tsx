'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { updateProfile } from '@/lib/api/userApi';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', displayName: '', bio: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        displayName: user.displayName || '',
        bio: user.bio || '',
      });
      setAvatarUrl(user.profilePictureUrl || '');
      setCoverUrl(user.coverPhotoUrl || '');
    }
  }, [user]);

  async function handleUpload(file: File, type: 'avatar' | 'cover') {
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_URL}/api/upload/${type}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const result = await res.json();
    setUploading(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }
    if (type === 'avatar') setAvatarUrl(result.data.profilePictureUrl);
    else setCoverUrl(result.data.coverPhotoUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    const result = await updateProfile(form);
    setSaving(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setSuccess(true);
  }

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-md px-4 pb-8">
      {/* Cover photo */}
      <div
        className="relative -mx-4 h-32 cursor-pointer bg-slate-200 bg-cover bg-center"
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : {}}
        onClick={() => coverInputRef.current?.click()}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-sm text-white">
          {uploading ? 'Uploading...' : 'Tap to change cover photo'}
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')}
        />
      </div>

      {/* Avatar */}
      <div className="-mt-10 mb-4 flex justify-center">
        <div
          className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-slate-200 bg-cover bg-center"
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}
          onClick={() => avatarInputRef.current?.click()}
        >
          {!avatarUrl && (
            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-600">
              {form.displayName?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'avatar')}
        />
      </div>

      <h1 className="mb-4 text-xl font-semibold">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Username</label>
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Display name</label>
          <input
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            maxLength={300}
            className="w-full rounded-lg border px-4 py-2"
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Profile updated!</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-slate-900 py-2 font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={() => router.push(`/u/${form.username}`)}
          className="w-full rounded-lg border py-2 font-medium text-slate-700"
        >
          View my profile
        </button>
      </form>
    </div>
  );
}
