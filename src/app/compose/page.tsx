'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/lib/api/postApi';
import { playPostSound } from '@/lib/sounds';

export default function ComposePage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    const result = await createPost(content.trim());

    if (result.success) {
      playPostSound();
      setTimeout(() => router.push('/'), 500);
    } else {
      alert(result.error?.message || 'Failed to create post');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-slate-500">
          Back
        </button>
        <h1 className="text-lg font-semibold">Create Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-4 shadow-sm">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={6}
          maxLength={5000}
          className="w-full resize-none rounded-lg border p-3 outline-none focus:ring-2"
          disabled={submitting}
        />

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">{content.length}/5000</span>

          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
