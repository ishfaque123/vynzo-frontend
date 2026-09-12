'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { playPostSound } from '@/lib/sounds';
import { takePendingComposeImage } from '@/lib/pendingComposeImage';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_LENGTH = 2000;

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function RemoveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
function Avatar({ url, name }: { url?: string; name?: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center text-sm font-semibold text-slate-600" style={url ? { backgroundImage: `url(${url})` } : {}}>
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

export default function ComposePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pending = takePendingComposeImage();
    if (pending) {
      setImage(pending);
      setImagePreview(URL.createObjectURL(pending));
    }
  }, []);

  function handlePickImage(file: File) {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }
  function removeImage() {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit() {
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('content', content.trim());
    formData.append('visibility', 'public');
    formData.append('taggedUserIds', '[]');
    if (image) formData.append('image', image);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/posts`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let result: any = null;
      try { result = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && result?.success) {
        setProgress(100);
        playPostSound();
        setTimeout(() => router.push('/'), 400);
      } else {
        alert(result?.error?.message || 'Failed to create post');
        setSubmitting(false);
        setProgress(0);
      }
    };

    xhr.onerror = () => {
      alert('Network error. Please try again.');
      setSubmitting(false);
      setProgress(0);
    };

    xhr.send(formData);
  }

  return (
    <div className="mx-auto flex h-[100dvh] max-w-xl flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button onClick={() => router.back()} aria-label="Close" disabled={submitting} className="text-slate-600 disabled:opacity-40">
          <CloseIcon />
        </button>
        <h1 className="text-base font-semibold">New Post</h1>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {submitting && (
        <div className="h-1 w-full bg-slate-100">
          <div className="h-full bg-blue-600 transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar url={user?.profilePictureUrl} name={user?.displayName} />
          <p className="font-semibold text-slate-900">{user?.displayName || user?.username}</p>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="What's on your mind?"
          rows={6}
          maxLength={MAX_LENGTH}
          autoFocus
          disabled={submitting}
          className="w-full resize-none border-none p-0 text-lg outline-none placeholder:text-slate-400"
        />

        {imagePreview && (
          <div className="relative mt-2 overflow-hidden rounded-xl">
            <img src={imagePreview} alt="" className="max-h-96 w-full object-cover" />
            {!submitting && (
              <button
                onClick={removeImage}
                aria-label="Remove photo"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
              >
                <RemoveIcon />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handlePickImage(e.target.files[0])}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={submitting}
          className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40"
        >
          <ImageIcon /> Photo
        </button>
        <span className="text-xs text-slate-400">{content.length}/{MAX_LENGTH}</span>
      </div>
    </div>
  );
}
