'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitProfileSetup } from '@/lib/api/authApi';
import { useAuth } from '@/lib/auth/useAuth';
import { COUNTRIES } from '@/lib/countries';
import Toast from '@/components/Toast';

export default function ProfileSetupPage() {
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ username: '', displayName: '', dateOfBirth: '', bio: '', gender: '', phone: '', country: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user?.profileCompleted) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  function isAtLeast13(dobStr: string): boolean {
    const dob = new Date(dobStr);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const hadBirthday = now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
    if (!hadBirthday) age -= 1;
    return age >= 13;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAtLeast13(form.dateOfBirth)) {
      setToast({ message: 'You must be at least 13 years old to use Frianzo.', type: 'error' });
      return;
    }
    setLoading(true);
    const result = await submitProfileSetup(form as any);
    setLoading(false);

    if (!result.success) {
      setToast({ message: result.error.message, type: 'error' });
      return;
    }
    router.push('/');
  }

  if (authLoading || user?.profileCompleted) {
    return <div className="flex justify-center py-10" role="status" aria-label="Loading profile"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" /></div>;
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
          <label className="mb-1 block text-sm text-slate-600">Country</label>
          <select
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full rounded-lg border px-4 py-2"
            required
          >
            <option value="">Select your country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Birthday</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            max={new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
            className="w-full rounded-lg border px-4 py-2"
            required
          />
          <p className="mt-1 text-xs text-slate-400">You must be at least 13 years old to use Frianzo.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full rounded-lg border px-4 py-2"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Contact number</label>
          <input
            type="tel"
            placeholder="e.g. 03xxxxxxxxx"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Bio</label>
          <textarea
            placeholder="Tell us about yourself"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            maxLength={300}
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Complete profile'}
        </button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
