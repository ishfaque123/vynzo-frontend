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
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full rounded-lg border px-4 py-2"
        />
        <input
          placeholder="Display name"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          className="w-full rounded-lg border px-4 py-2"
        />
        <textarea
          placeholder="Bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          maxLength={300}
          className="w-full rounded-lg border px-4 py-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Profile updated!</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-slate-900 py-2 text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        <button
          type="button"
          onClick={() => router.push(`/u/${form.username}`)}
          className="w-full rounded-lg border py-2 text-slate-700"
        >
          View my profile
        </button>
      </form>
    </div>
  );
}
