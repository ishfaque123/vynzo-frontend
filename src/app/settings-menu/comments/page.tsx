'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CommentsSettingPage() {
  const { user, loading } = useAuth();
  const [disabled, setDisabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setDisabled(!!user.commentsDisabled);
  }, [user]);

  async function handleToggle() {
    setSaving(true);
    const res = await fetch(`${API_URL}/api/comments/settings/toggle`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !disabled }),
    });
    const result = await res.json();
    setSaving(false);
    if (result.success) setDisabled(result.data.commentsDisabled);
  }

  if (loading) return <p className="p-8 text-center text-slate-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Comments</h1>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Allow comments on your posts</p>
          <p className="text-sm text-slate-500">
            {disabled ? 'Comments are currently OFF for your posts.' : 'Comments are currently ON for your posts.'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`h-7 w-12 rounded-full transition-colors ${
            !disabled ? 'bg-slate-900' : 'bg-slate-300'
          }`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white transition-transform ${
              !disabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
