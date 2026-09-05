'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { createPost } from '@/lib/api/postApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function Avatar({ url, name }: { url?: string; name?: string }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center font-semibold text-slate-600"
      style={url ? { backgroundImage: `url(${url})` } : {}}
    >
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}

function GalleryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.6 12l-8.4 8.4a2 2 0 01-2.8 0L3 14V3h11l6.6 6.6a2 2 0 010 2.8z" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function ComposePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tagQuery, setTagQuery] = useState('');
  const [tagResults, setTagResults] = useState<any[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<any[]>([]);
  const [showTagBox, setShowTagBox] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImagePick(file: File) {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleTagSearch(q: string) {
    setTagQuery(q);
    if (!q.trim()) {
      setTagResults([]);
      return;
    }
    const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}`, {
      credentials: 'include',
    });
    const result = await res.json();
    if (result.success) setTagResults(result.data.users);
  }

  function addTag(u: any) {
    if (taggedUsers.length >= 2 || taggedUsers.some((t) => t.id === u.id)) return;
    setTaggedUsers([...taggedUsers, u]);
    setTagQuery('');
    setTagResults([]);
    setShowTagBox(false);
  }

  function removeTag(id: string) {
    setTaggedUsers(taggedUsers.filter((t) => t.id !== id));
  }

  async function handlePost() {
    if (!content.trim() && !image) return;
    setPosting(true);
    const result = await createPost(content, image, visibility, taggedUsers.map((t) => t.id));
    setPosting(false);
    if (result.success) {
      router.push('/');
    } else {
      alert(result.error.message);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button onClick={() => router.back()} className="text-slate-500">
          <CloseIcon />
        </button>
        <h1 className="font-semibold">Create Post</h1>
        <button
          onClick={handlePost}
          disabled={posting || (!content.trim() && !image)}
          className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar url={user?.profilePictureUrl} name={user?.displayName} />
          <div>
            <p className="font-medium">{user?.displayName}</p>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              className="rounded border px-2 py-0.5 text-xs text-slate-600"
            >
              <option value="public">🌐 Public</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${user?.displayName || ''}?`}
          maxLength={2000}
          className="w-full resize-none border-none text-lg outline-none"
          rows={5}
          autoFocus
        />

        {taggedUsers.length > 0 && (
          <p className="mb-2 text-sm text-slate-500">
            with{' '}
            {taggedUsers.map((t, i) => (
              <span key={t.id} className="font-medium text-slate-800">
                {t.displayName}
                {i < taggedUsers.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        )}

        {imagePreview && (
          <div className="relative mb-3">
            <img src={imagePreview} alt="preview" className="w-full rounded-lg" />
            <button
              onClick={() => { setImage(null); setImagePreview(null); }}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {showTagBox && (
          <div className="mb-3 rounded-lg border p-3">
            <input
              value={tagQuery}
              onChange={(e) => handleTagSearch(e.target.value)}
              placeholder="Search people to tag..."
              className="w-full rounded-lg border px-3 py-1.5 text-sm"
              autoFocus
            />
            <div className="mt-2 space-y-1">
              {tagResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => addTag(u)}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-slate-50"
                >
                  <Avatar url={u.profilePictureUrl} name={u.displayName} />
                  <div>
                    <p className="text-sm font-medium">{u.displayName}</p>
                    <p className="text-xs text-slate-500">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {taggedUsers.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {taggedUsers.map((t) => (
              <span key={t.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm">
                {t.displayName}
                <button onClick={() => removeTag(t.id)}><CloseIcon /></button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm font-medium text-slate-600">Add to your post</span>
          <div className="flex gap-3">
            <button onClick={() => fileInputRef.current?.click()} className="text-green-600">
              <GalleryIcon />
            </button>
            <button
              onClick={() => setShowTagBox(!showTagBox)}
              disabled={taggedUsers.length >= 2}
              className="text-blue-600 disabled:opacity-30"
            >
              <TagIcon />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImagePick(e.target.files[0])}
          />
        </div>
      </div>
    </div>
  );
}
