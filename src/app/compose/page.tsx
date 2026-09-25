'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { playPostSound } from '@/lib/sounds';
import { takePendingComposeImage } from '@/lib/pendingComposeImage';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_LENGTH = 2000;
const MAX_TAGS = 2;

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
function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3" /><path d="M2 20c0-3.3 3-5.5 7-5.5s7 2.2 7 5.5" /><circle cx="18" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18 14 14 0 010-18z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function Avatar({ url, name, size = 10 }: { url?: string; name?: string; size?: number }) {
  const px = size === 10 ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs';
  return (
    <div className={`flex ${px} shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center font-semibold text-slate-600`} style={url ? { backgroundImage: `url(${url})` } : {}}>
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

const AUDIENCE_OPTIONS = [
  { value: 'public' as const, label: 'Public', desc: 'Anyone on Frianzo', icon: <GlobeIcon /> },
  { value: 'private' as const, label: 'Only me', desc: 'Only you can see this', icon: <LockIcon /> },
];

export default function ComposePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [audiencePickerOpen, setAudiencePickerOpen] = useState(false);

  const [taggedUsers, setTaggedUsers] = useState<{ id: string; displayName: string; username: string; profilePictureUrl?: string }[]>([]);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [tagResults, setTagResults] = useState<any[]>([]);
  const [tagSearching, setTagSearching] = useState(false);

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

  async function handleTagSearch(q: string) {
    setTagQuery(q);
    if (!q.trim()) {
      setTagResults([]);
      return;
    }
    setTagSearching(true);
    const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
    const result = await res.json();
    setTagSearching(false);
    if (result.success) setTagResults(result.data.users);
  }
  function addTag(u: any) {
    if (taggedUsers.length >= MAX_TAGS || taggedUsers.some((t) => t.id === u.id) || u.id === user?.id) return;
    setTaggedUsers((prev) => [...prev, { id: u.id, displayName: u.displayName, username: u.username, profilePictureUrl: u.profilePictureUrl }]);
  }
  function removeTag(id: string) {
    setTaggedUsers((prev) => prev.filter((t) => t.id !== id));
  }
  function closeTagPicker() {
    setTagPickerOpen(false);
    setTagQuery('');
    setTagResults([]);
  }

  function handleSubmit() {
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('content', content.trim());
    formData.append('visibility', visibility);
    formData.append('taggedUserIds', JSON.stringify(taggedUsers.map((t) => t.id)));
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

  const currentAudience = AUDIENCE_OPTIONS.find((a) => a.value === visibility)!;

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
        <div className="flex items-center gap-2">
          <Avatar url={user?.profilePictureUrl} name={user?.displayName} />
          <div>
            <p className="font-semibold text-slate-900">{user?.displayName || user?.username}</p>
            <button
              type="button"
              onClick={() => setAudiencePickerOpen(true)}
              disabled={submitting}
              className="mt-0.5 flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 disabled:opacity-40"
            >
              {currentAudience.icon}
              {currentAudience.label}
              <ChevronDownIcon />
            </button>
          </div>
        </div>

        {taggedUsers.length > 0 && (
          <p className="mt-2 text-sm text-slate-500">
            with{' '}
            {taggedUsers.map((t, i) => (
              <span key={t.id}>
                <span className="font-medium text-slate-700">{t.displayName}</span>
                <button type="button" onClick={() => removeTag(t.id)} className="ml-0.5 text-slate-400">×</button>
                {i < taggedUsers.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="What's on your mind?"
          rows={2}
          maxLength={MAX_LENGTH}
          autoFocus
          disabled={submitting}
          className="mt-2 w-full resize-none border-none !bg-transparent p-0 text-lg outline-none placeholder:text-slate-400"
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
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setTagPickerOpen(true)}
            disabled={submitting || taggedUsers.length >= MAX_TAGS}
            className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40"
          >
            <TagIcon /> Tag
          </button>
        </div>
        <span className="text-xs text-slate-400">{content.length}/{MAX_LENGTH}</span>
      </div>

      {audiencePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setAudiencePickerOpen(false)}>
          <div className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-center text-sm font-semibold text-slate-800">Who can see this post?</p>
            <div className="space-y-1">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setVisibility(opt.value); setAudiencePickerOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${visibility === opt.value ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <span className="text-slate-600">{opt.icon}</span>
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{opt.label}</span>
                    <span className="block text-xs text-slate-500">{opt.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tagPickerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <button onClick={closeTagPicker} aria-label="Close" className="text-slate-600"><CloseIcon /></button>
            <input
              value={tagQuery}
              onChange={(e) => handleTagSearch(e.target.value)}
              placeholder="Search people to tag"
              autoFocus
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <p className="px-4 pt-2 text-xs text-slate-400">You can tag up to {MAX_TAGS} people.</p>
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {tagSearching && <div className="flex justify-center py-3"><div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /></div>}
            {tagResults.map((u) => {
              const already = taggedUsers.some((t) => t.id === u.id);
              const disabled = already || u.id === user?.id || (taggedUsers.length >= MAX_TAGS && !already);
              return (
                <button
                  key={u.id}
                  onClick={() => { addTag(u); closeTagPicker(); }}
                  disabled={disabled}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left disabled:opacity-40"
                >
                  <Avatar url={u.profilePictureUrl} name={u.displayName} size={9} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{u.displayName}</span>
                    <span className="block truncate text-xs text-slate-500">@{u.username}</span>
                  </span>
                  {already && <span className="ml-auto text-xs font-medium text-blue-600">Tagged</span>}
                </button>
              );
            })}
            {!tagSearching && tagQuery && tagResults.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500">No users found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
