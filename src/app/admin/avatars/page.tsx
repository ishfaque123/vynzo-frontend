'use client';
import { useState } from 'react';

const ENGAGER_ACCOUNTS = [
  'ali_raza_01', 'sana_khan_pk', 'bilal_ahmed_99', 'fatima_noor', 'usman_tariq',
  'ayesha_malik', 'hassan_jutt', 'maria_sheikh', 'imran_khan_007', 'zainab_ali',
];

export default function AvatarUploadPage() {
  const [results, setResults] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  async function uploadAvatar(username: string, file: File) {
    setUploading(username);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('image', file);
      const res = await fetch('https://api.frianzo.online/api/admin/users/avatar', {
        method: 'POST',
        // Session cookie auth (HttpOnly): the app no longer stores a JWT in
        // localStorage, so send cookies instead of a Bearer token.
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResults((r) => ({ ...r, [username]: '✅ Done' }));
      } else {
        setResults((r) => ({ ...r, [username]: `❌ ${data.error?.message || 'Failed'}` }));
      }
    } catch (e: any) {
      setResults((r) => ({ ...r, [username]: `❌ ${e.message}` }));
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Avatars</h2>
        <p className="mt-1 text-sm text-slate-500">Upload profile pictures for AI engager accounts.</p>
      </div>
      <div className="grid gap-4">
        {ENGAGER_ACCOUNTS.map((username) => (
          <div key={username} className="flex items-center gap-4 rounded-xl border bg-white p-4">
            <span className="w-40 font-medium">@{username}</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading === username}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(username, file);
              }}
              className="text-sm"
            />
            {uploading === username && <span className="text-sm text-blue-600">Uploading...</span>}
            {results[username] && <span className="text-sm">{results[username]}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
