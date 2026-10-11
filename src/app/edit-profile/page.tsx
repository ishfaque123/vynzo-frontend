'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchUserProfile, updateProfile } from '@/lib/api/userApi';
import Toast from '@/components/Toast';

export default function EditProfilePage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    website: '',
    city: '',
    province: '',
  });

  useEffect(() => {
    if (!currentUser?.username) return;
    fetchUserProfile(currentUser.username).then((result) => {
      if (result.success) {
        const u = result.data.user;
        setForm({
          displayName: u.displayName || '',
          bio: u.bio || '',
          website: u.website || '',
          city: u.city || '',
          province: u.province || '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentUser?.username]);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSave() {
    if (saving) return;
    if (!form.displayName.trim()) {
      setToast({ message: 'Please enter your name.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const result = await updateProfile({
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        website: form.website.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
      } as any);
      if (result.success) {
        setToast({ message: 'Profile updated.', type: 'success' });
        setTimeout(() => router.back(), 800);
      } else {
        setToast({ message: result.error?.message || 'Could not update profile.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Could not update profile. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900';
  const labelCls = 'mb-1 block text-sm font-medium text-slate-700';

  return (
    <div className="mx-auto max-w-xl pb-8">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <button onClick={() => router.back()} aria-label="Go back" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 className="text-base font-semibold text-slate-900">Edit Profile</h1>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <label className={labelCls}>Name</label>
          <input value={form.displayName} onChange={set('displayName')} maxLength={50} placeholder="Your name" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Bio</label>
          <textarea value={form.bio} onChange={set('bio')} maxLength={300} rows={3} placeholder="Tell people about yourself" className={`${inputCls} resize-none`} />
          <p className="mt-1 text-right text-xs text-slate-400">{form.bio.length}/300</p>
        </div>
        <div>
          <label className={labelCls}>Website</label>
          <input value={form.website} onChange={set('website')} maxLength={200} placeholder="https://example.com" inputMode="url" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>City</label>
            <input value={form.city} onChange={set('city')} maxLength={50} placeholder="City" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Province</label>
            <input value={form.province} onChange={set('province')} maxLength={50} placeholder="Province" className={inputCls} />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
