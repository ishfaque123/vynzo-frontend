'use client';

import { useEffect, useState } from 'react';
import { fetchAdminSeoSettings, updateAdminSeoSettings } from '@/lib/api/adminApi';

export default function Page() {
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAdminSeoSettings().then((result) => {
      if (result.success) {
        setSeoTitle(result.data.settings.seoTitle || '');
        setSeoDescription(result.data.settings.seoDescription || '');
        setSeoKeywords(result.data.settings.seoKeywords || '');
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await updateAdminSeoSettings({ seoTitle, seoDescription, seoKeywords });
    setSaving(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Saved. Changes go live within a minute.' });
    } else {
      setMessage({ type: 'error', text: result.error?.message || 'Could not save settings.' });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Manage administrator and platform settings.</p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900">Search Engine (SEO) Settings</h3>
        <p className="mt-1 text-sm text-slate-500">
          Controls what shows up as the site title and description on Google search results and browser tabs.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Site title</label>
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                maxLength={200}
                placeholder="Frianzo"
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Frianzo — share your moments"
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Keywords (comma separated, optional)</label>
              <input
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                maxLength={500}
                placeholder="social media, photo sharing, reels"
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>

            {message && (
              <div className={`rounded-xl p-3 text-sm ${message.type === 'success' ? 'border border-green-200 bg-green-50 text-green-700' : 'border border-red-200 bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
