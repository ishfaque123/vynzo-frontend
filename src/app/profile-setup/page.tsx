'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitProfileSetup } from '@/lib/api/authApi';
import { useAuth } from '@/lib/auth/useAuth';
import Toast from '@/components/Toast';

export default function ProfileSetupPage() {
  const { user, loading: authLoading, verified } = useAuth();
  const [form, setForm] = useState({ username: '', displayName: '', dateOfBirth: '', bio: '', gender: '', customGender: '', phone: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,30}$/;

  // Live username validation + availability (debounced)
  function handleUsernameChange(value: string) {
    const clean = value.toLowerCase().replace(/\s/g, '');
    setForm({ ...form, username: clean });
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (!clean) { setUsernameStatus('idle'); return; }
    if (!USERNAME_REGEX.test(clean)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${encodeURIComponent(clean)}`, { credentials: 'include' });
        setUsernameStatus(res.ok ? 'taken' : 'available');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
  }

  useEffect(() => {
    if (verified && user?.profileCompleted) {
      router.replace('/');
    }
  }, [verified, user, router]);

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
    if (!USERNAME_REGEX.test(form.username)) {
      setToast({ message: 'Username must be 3-30 characters: letters, numbers, underscore, or period.', type: 'error' });
      return;
    }
    if (usernameStatus === 'taken') {
      setToast({ message: 'This username is taken. Please choose another.', type: 'error' });
      return;
    }
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
          <label className="mb-1 block text-sm text-slate-600">Name</label>
          <input
            placeholder="e.g. ali_khan123"
            value={form.username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className={`w-full rounded-lg border px-4 py-2 ${usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-400' : usernameStatus === 'available' ? 'border-green-400' : ''}`}
            required
          />
          {usernameStatus === 'checking' && <p className="mt-1 text-xs text-slate-400">Checking availability...</p>}
          {usernameStatus === 'available' && <p className="mt-1 text-xs text-green-600">✓ Username available</p>}
          {usernameStatus === 'taken' && <p className="mt-1 text-xs text-red-500">✗ Username taken, try another</p>}
          {usernameStatus === 'invalid' && form.username && <p className="mt-1 text-xs text-red-500">3-30 chars: letters, numbers, _ or .</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Full Name</label>
          <input
            placeholder="e.g. Ali Khan"
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
            max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 13); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}
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
          {form.gender === 'custom' && (
            <input
              placeholder="Describe your gender"
              value={form.customGender}
              onChange={(e) => setForm({ ...form, customGender: e.target.value })}
              maxLength={30}
              className="mt-2 w-full rounded-lg border px-4 py-2"
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Contact number</label>
          <input
            type="tel"
            placeholder="e.g. 03xxxxxxxxx"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+\-\s]/g, "") })}
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
          <p className="mt-1 text-right text-xs text-slate-400">{form.bio.length}/300</p>
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
