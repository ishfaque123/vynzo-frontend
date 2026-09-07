'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAccountRequest } from '@/lib/api/authApi';

function TrashIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

export default function DeleteAccountPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setError('');
    setDeleting(true);
    const result = await deleteAccountRequest();
    setDeleting(false);
    if (!result.success) { setError(result.error?.message || 'Something went wrong.'); return; }
    router.push('/login');
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
        <TrashIcon />
      </div>
      <h1 className="mb-2 text-center text-lg font-semibold text-red-600">Delete your account</h1>
      <p className="mb-6 text-center text-sm text-slate-500">
        This will permanently delete your profile, posts, comments, and followers. This can't be undone.
      </p>

      <label className="mb-1 block text-sm text-slate-600">
        Type <b>DELETE</b> to confirm
      </label>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="mb-4 w-full rounded-lg border px-4 py-2"
        placeholder="DELETE"
      />

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleDelete}
        disabled={confirmText !== 'DELETE' || deleting}
        className="w-full rounded-lg bg-red-600 py-2.5 font-medium text-white disabled:opacity-40"
      >
        {deleting ? 'Deleting...' : 'Permanently delete account'}
      </button>
      <button onClick={() => router.back()} className="mt-2 w-full rounded-lg border py-2.5 font-medium text-slate-700">
        Cancel
      </button>
    </div>
  );
}
