'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { playPostSound } from '@/lib/sounds';
import { takePendingComposeImage } from '@/lib/pendingComposeImage';
import { setPendingReelVideo } from '@/lib/pendingReelVideo';
import { fetchReelsConfig, fetchMyReelStatus } from '@/lib/api/reelApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_LENGTH = 2000;
const MAX_TAGS = 2;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const BACKGROUND_OPTIONS = [
  { value: 'sunset' as const, label: 'Sunset', className: 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600' },
  { value: 'ocean' as const, label: 'Ocean', className: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600' },
  { value: 'violet' as const, label: 'Violet', className: 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500' },
  { value: 'mint' as const, label: 'Mint', className: 'bg-gradient-to-br from-emerald-300 via-teal-400 to-cyan-500' },
  { value: 'peach' as const, label: 'Peach', className: 'bg-gradient-to-br from-yellow-300 via-orange-400 to-rose-500' },
  { value: 'night' as const, label: 'Night', className: 'bg-gradient-to-br from-slate-700 via-slate-900 to-black' },
  { value: 'rose' as const, label: 'Rose', className: 'bg-gradient-to-br from-rose-400 via-red-500 to-pink-600' },
  { value: 'sky' as const, label: 'Sky', className: 'bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-500' },
];

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
function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}
function VideoNotice({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-5" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="mb-4 text-sm leading-6 text-slate-700">{message}</p>
        <button type="button" onClick={onClose} className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">OK</button>
      </div>
    </div>
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
function CommentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.4 8.4 0 01-9 8.5 8.8 8.8 0 01-4.1-1L3 20l1.5-4.2A8.3 8.3 0 013 11.5 8.5 8.5 0 0112 3a8.5 8.5 0 019 8.5z" />
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

const COMMENT_AUDIENCE_OPTIONS = [
  { value: 'everyone' as const, label: 'Everyone', desc: 'Anyone can comment' },
  { value: 'followers' as const, label: 'Followers', desc: 'Only your followers can comment' },
  { value: 'only_me' as const, label: 'Only me', desc: 'Comments are disabled for everyone else' },
];

const AUDIENCE_OPTIONS = [
  { value: 'public' as const, label: 'Public', desc: 'Anyone on Frianzo', icon: <GlobeIcon /> },
  { value: 'private' as const, label: 'Only me', desc: 'Only you can see this', icon: <LockIcon /> },
];

export default function ComposePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [backgroundStyle, setBackgroundStyle] = useState<typeof BACKGROUND_OPTIONS[number]['value'] | null>(null);
  const [backgroundPickerOpen, setBackgroundPickerOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoNotice, setVideoNotice] = useState<string | null>(null);

  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [audiencePickerOpen, setAudiencePickerOpen] = useState(false);
  const [commentAudience, setCommentAudience] = useState<'everyone' | 'followers' | 'only_me'>('everyone');
  const [commentAudiencePickerOpen, setCommentAudiencePickerOpen] = useState(false);

  const [taggedUsers, setTaggedUsers] = useState<{ id: string; displayName: string; username: string; profilePictureUrl?: string }[]>([]);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [tagResults, setTagResults] = useState<any[]>([]);
  const [tagSearching, setTagSearching] = useState(false);

  useEffect(() => {
    const pending = takePendingComposeImage();
    if (pending) {
      if (pending.size > MAX_IMAGE_SIZE) {
        setVideoNotice('Photo is too large. Please choose a photo smaller than 10 MB.');
        return;
      }
      setImage(pending);
      setImagePreview(URL.createObjectURL(pending));
    }
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [content]);

  function handlePickImage(file: File) {
    if (file.size > MAX_IMAGE_SIZE) {
      setVideoNotice('Photo is too large. Please choose a photo smaller than 10 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setBackgroundStyle(null);
    setImagePreview(URL.createObjectURL(file));
  }
  async function handleVideoPicked(file: File) {
    if (!file.type.startsWith('video/')) {
      setVideoNotice('Please select a video file.');
      return;
    }
    const [config, status] = await Promise.all([fetchReelsConfig(), fetchMyReelStatus()]);
    const enabled = !!(config.success && config.data?.enabled);
    if (!enabled) {
      setVideoNotice('Video reels are not available right now.');
      return;
    }
    const remaining = status.success ? Number(status.data?.remaining) : 0;
    if (!Number.isFinite(remaining) || remaining <= 0) {
      setVideoNotice("You've reached your reel limit for the last 24 hours. Please try again later.");
      return;
    }
    const maxDuration = Number(config.data?.maxDurationSec) > 0 ? Number(config.data.maxDurationSec) : 60;

    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      const duration = probe.duration;
      URL.revokeObjectURL(objectUrl);
      probe.removeAttribute('src');
      probe.load();
      if (!Number.isFinite(duration) || duration <= 0) {
        setVideoNotice('Could not read the video duration. Please choose another video.');
        return;
      }
      if (duration > maxDuration) {
        setVideoNotice(`Reels must be ${maxDuration} seconds or shorter.`);
        return;
      }
      setPendingReelVideo(file, duration);
      router.push('/reels/new');
    };
    probe.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      probe.removeAttribute('src');
      probe.load();
      setVideoNotice('Could not read this video. Please choose another video.');
    };
    probe.src = objectUrl;
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

  function handleClose() {
    if (submitting) return;
    if (content.trim() || image || taggedUsers.length > 0) {
      const discard = window.confirm('Discard post? Your photo and caption will be lost.');
      if (!discard) return;
    }
    router.back();
  }

  function handleSubmit() {
    if ((!content.trim() && !image) || submitting) return;

    setSubmitting(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('content', content.trim());
    formData.append('visibility', visibility);
    formData.append('commentAudience', commentAudience);
    if (backgroundStyle && !image) formData.append('backgroundStyle', backgroundStyle);
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
  const currentCommentAudience = COMMENT_AUDIENCE_OPTIONS.find((a) => a.value === commentAudience)!;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-xl flex-col overflow-x-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button onClick={handleClose} aria-label="Close" disabled={submitting} className="text-slate-600 disabled:opacity-40">
          <CloseIcon />
        </button>
        <h1 className="text-base font-semibold">New Post</h1>
        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && !image) || submitting}
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
        <div className="flex flex-wrap items-center gap-1.5">
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
            <button
              type="button"
              onClick={() => setCommentAudiencePickerOpen(true)}
              disabled={submitting}
              className="mt-1 flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 disabled:opacity-40"
            >
              <CommentIcon />
              Comments: {currentCommentAudience.label}
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

        {backgroundStyle && !image ? (
          <div className={`mt-3 flex min-h-56 items-center justify-center rounded-2xl p-6 text-center ${BACKGROUND_OPTIONS.find((b) => b.value === backgroundStyle)?.className}`}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="What's on your mind?"
              rows={4}
              maxLength={MAX_LENGTH}
              autoFocus
              disabled={submitting}
              className="w-full resize-none overflow-hidden border-none bg-transparent p-0 text-center text-2xl font-bold text-white outline-none placeholder:text-white/70"
            />
          </div>
        ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="What's on your mind?"
          rows={2}
          maxLength={MAX_LENGTH}
          autoFocus
          disabled={submitting}
          className="mt-2 w-full resize-none overflow-hidden border-none !bg-transparent p-0 text-lg outline-none placeholder:text-slate-400"
        />
        )}

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

      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
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
            aria-label="Add photo"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-slate-600 disabled:opacity-40"
          >
            <ImageIcon />
          </button>
          <button
            onClick={() => setBackgroundPickerOpen(true)}
            disabled={submitting || !!image}
            aria-label="Add text background"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-slate-600 disabled:opacity-40"
          >
            <span className="text-sm font-bold">Aa</span>
          </button>
          <button
            onClick={() => setTagPickerOpen(true)}
            disabled={submitting || taggedUsers.length >= MAX_TAGS}
            aria-label="Tag people"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-slate-600 disabled:opacity-40"
          >
            <TagIcon />
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleVideoPicked(file); }}
          />
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={submitting}
            aria-label="Record video"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-slate-600 disabled:opacity-40"
          >
            <CameraIcon />
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleVideoPicked(file); }}
          />
          <button
            onClick={() => videoInputRef.current?.click()}
            disabled={submitting}
            aria-label="Upload video"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-slate-600 disabled:opacity-40"
          >
            <VideoIcon />
          </button>
        </div>
        <span className="text-xs text-slate-400">{content.length}/{MAX_LENGTH}</span>
      </div>

      {videoNotice && <VideoNotice message={videoNotice} onClose={() => setVideoNotice(null)} />}

      {backgroundPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setBackgroundPickerOpen(false)}>
          <div className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-center text-sm font-semibold text-slate-800">Choose a background</p>
            <div className="grid grid-cols-4 gap-2">
              {BACKGROUND_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => { setBackgroundStyle(opt.value); setBackgroundPickerOpen(false); }} className={`h-16 rounded-xl ${opt.className} ${backgroundStyle === opt.value ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`} aria-label={opt.label} />
              ))}
            </div>
            <button type="button" onClick={() => { setBackgroundStyle(null); setBackgroundPickerOpen(false); }} className="mt-3 w-full rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700">No background</button>
          </div>
        </div>
      )}

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

      {commentAudiencePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setCommentAudiencePickerOpen(false)}>
          <div className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-center text-sm font-semibold text-slate-800">Who can comment on this post?</p>
            <div className="space-y-1">
              {COMMENT_AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setCommentAudience(opt.value); setCommentAudiencePickerOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${commentAudience === opt.value ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <CommentIcon />
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
