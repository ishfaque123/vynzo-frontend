'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitProfileSetup } from '@/lib/api/authApi';

export default function ProfileSetupPage() {
  const [form, setForm] = useState({ username: '', displayName: '', dateOfBirth: '', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await submitProfileSetup(form);
    setLoading(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.push('/');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Complete your profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Username</label>
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full rounded-lg border px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Display name</label>
          <input
            placeholder="Display name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full rounded-lg border px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Birthday</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className="w-full rounded-lg border px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Bio (optional)</label>
          <textarea
            placeholder="Tell us about yourself"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            maxLength={300}
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Complete profile'}
        </button>
      </form>
    </div>
  );
}
