'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { updateProfile } from '@/lib/api/userApi';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const PROVINCES: Record<string, string[]> = {
  Sindh: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Khairpur', 'Mirpurkhas'],
  Punjab: ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Abbottabad', 'Mardan', 'Swat', 'Kohat'],
  Balochistan: ['Quetta', 'Gwadar', 'Turbat', 'Khuzdar'],
  Islamabad: ['Islamabad'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu'],
  'Azad Kashmir': ['Muzaffarabad', 'Mirpur'],
};

function Avatar({ url, name }: { url?: string; name?: string }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-200 bg-cover bg-center text-2xl font-semibold text-slate-600" style={url ? { backgroundImage: `url(${url})` } : {}}>
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    username: '', displayName: '', bio: '', gender: '', website: '', phone: '', province: '', city: '',
  });
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
        gender: user.gender || '',
        website: user.website || '',
        phone: user.phone || '',
        province: user.province || '',
        city: user.city || '',
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
    const res = await fetch(`${API_URL}/api/upload/${type}`, { method: 'POST', credentials: 'include', body: formData });
    const result = await res.json();
    setUploading(false);
    if (!result.success) { setError(result.error.message); return; }
    if (type === 'avatar') setAvatarUrl(result.data.profilePictureUrl);
    else setCoverUrl(result.data.coverPhotoUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    const result = await updateProfile(form as any);
    setSaving(false);
    if (!result.success) { setError(result.error.message); return; }
    setSuccess(true);
  }

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-md px-4 pb-8">
      <div
        className="relative -mx-4 h-32 cursor-pointer bg-slate-200 bg-cover bg-center"
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : {}}
        onClick={() => coverInputRef.current?.click()}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-sm text-white">
          {uploading ? 'Uploading...' : 'Tap to change cover photo'}
        </div>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')} />
      </div>

      <div className="relative z-10 -mt-10 mb-4 flex justify-center">
        <div onClick={() => avatarInputRef.current?.click()} className="cursor-pointer">
          <Avatar url={avatarUrl} name={form.displayName} />
        </div>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'avatar')} />
      </div>

      <h1 className="mb-4 text-xl font-semibold">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Username</label>
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full rounded-lg border px-4 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Full Name</label>
          <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="w-full rounded-lg border px-4 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={300} className="w-full rounded-lg border px-4 py-2" rows={3} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Gender</label>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-lg border px-4 py-2">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Province</label>
          <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value, city: '' })} className="w-full rounded-lg border px-4 py-2">
            <option value="">Select</option>
            {Object.keys(PROVINCES).map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        {form.province && (
          <div>
            <label className="mb-1 block text-sm text-slate-600">City</label>
            <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border px-4 py-2">
              <option value="">Select</option>
              {PROVINCES[form.province]?.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm text-slate-600">Website</label>
          <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" className="w-full rounded-lg border px-4 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600">Contact Number</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border px-4 py-2" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Profile updated!</p>}

        <button type="submit" disabled={saving} className="w-full rounded-lg bg-slate-900 py-2 font-medium text-white disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => router.push(`/u/${form.username}`)} className="w-full rounded-lg border py-2 font-medium text-slate-700">
          View my profile
        </button>
      </form>
    </div>
  );
}
