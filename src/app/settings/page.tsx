'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { updateProfile } from '@/lib/api/userApi';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', displayName: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        displayName: user.displayName || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

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
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Edit Profile</h1>

      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600">
          {form.displayName?.[0]?.toUpperCase() || '?'}
        </div>
      </div>

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
