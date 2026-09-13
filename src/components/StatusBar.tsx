'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchStatusFeed, createStatus, createStatusWithProgress } from '@/lib/api/statusApi';
import StatusViewer from './StatusViewer';

const BG_COLORS = ['#1e293b', '#7c3aed', '#be185d', '#0369a1', '#15803d', '#b45309'];

function PlusBadge() {
  return (
    <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </span>
  );
}
function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function TextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

export default function StatusBar({ user }: { user: any }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpenIndex, setViewerOpenIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [textComposerOpen, setTextComposerOpen] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [visibility, setVisibility] = useState<'everyone' | 'close_friends'>('everyone');
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    fetchStatusFeed().then((result) => {
      if (result.success) setGroups(result.data.feed);
      setLoading(false);
    });
  }
  useEffect(() => {
    load();
  }, []);

  const myGroup = groups.find((g) => g.userId === user.id);
  const otherGroups = groups.filter((g) => g.userId !== user.id);

  function handleAvatarClick() {
    if (myGroup && myGroup.items.length > 0) {
      const idx = groups.findIndex((g) => g.userId === user.id);
      setViewerOpenIndex(idx);
    } else {
      setPickerOpen(true);
    }
  }

  async function handlePickPhoto(file: File) {
    setPickerOpen(false);
    setPosting(true);
    setUploadProgress(0);
    const result = await createStatusWithProgress({ media: file, visibility }, setUploadProgress);
    setPosting(false);
    setUploadProgress(null);
    if (result.success) {
      load();
    } else {
      alert(result.error?.message || 'Could not post your status. Please try again.');
    }
  }

  async function handlePostText() {
    if (!textValue.trim() || posting) return;
    setPosting(true);
    const result = await createStatus({ textContent: textValue.trim(), bgColor, visibility });
    setPosting(false);
    if (result.success) {
      setTextComposerOpen(false);
      setTextValue('');
      load();
    } else {
      alert(result.error?.message || 'Could not post your status. Please try again.');
    }
  }

  function handleOtherClick(groupUserId: string) {
    const idx = groups.findIndex((g) => g.userId === groupUserId);
    setViewerOpenIndex(idx);
  }

  if (loading || groups.length === 0) {
    // Still show "Your status" even with an empty feed so there's always
    // a way to post the first one.
    if (loading) return null;
  }

  return (
    <>
      <div className="mb-3 flex gap-3 overflow-x-auto pb-1">
        <button onClick={handleAvatarClick} className="flex flex-shrink-0 flex-col items-center gap-1">
          <span className="relative">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full p-0.5 ${
                myGroup && myGroup.items.length > 0 ? 'bg-slate-300' : ''
              }`}
            >
              <span
                className="h-full w-full rounded-full border-2 border-white bg-slate-200 bg-cover bg-center"
                style={user.profilePictureUrl ? { backgroundImage: `url(${user.profilePictureUrl})` } : {}}
              />
            </span>
            <PlusBadge />
          </span>
          <span className="max-w-[60px] truncate text-[11px] text-slate-600">Your status</span>
        </button>

        {otherGroups.map((g) => (
          <button key={g.userId} onClick={() => handleOtherClick(g.userId)} className="flex flex-shrink-0 flex-col items-center gap-1">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full p-0.5 ${
                g.hasUnseen ? 'bg-gradient-to-tr from-amber-400 to-pink-600' : 'bg-slate-300'
              }`}
            >
              <span
                className="h-full w-full rounded-full border-2 border-white bg-slate-200 bg-cover bg-center"
                style={g.user?.profilePictureUrl ? { backgroundImage: `url(${g.user.profilePictureUrl})` } : {}}
              />
            </span>
            <span className="max-w-[60px] truncate text-[11px] text-slate-600">{g.user?.displayName}</span>
          </button>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePickPhoto(file);
          e.target.value = '';
        }}
      />

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setPickerOpen(false)}>
          <div className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-center text-sm font-semibold text-slate-800">Add to your status</p>
            <div className="mb-3 flex rounded-lg border p-1 text-sm">
              <button
                onClick={() => setVisibility('everyone')}
                className={`flex-1 rounded-md py-1.5 font-medium ${visibility === 'everyone' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
              >
                Everyone
              </button>
              <button
                onClick={() => setVisibility('close_friends')}
                className={`flex-1 rounded-md py-1.5 font-medium ${visibility === 'close_friends' ? 'bg-green-600 text-white' : 'text-slate-600'}`}
              >
                Close Friends
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left hover:bg-slate-50"
              >
                <ImageIcon />
                <span className="text-sm text-slate-800">Photo or video</span>
              </button>
              <button
                onClick={() => {
                  setPickerOpen(false);
                  setTextComposerOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left hover:bg-slate-50"
              >
                <TextIcon />
                <span className="text-sm text-slate-800">Text status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {textComposerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: bgColor }}>
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setTextComposerOpen(false)} className="text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <button
              onClick={handlePostText}
              disabled={!textValue.trim() || posting}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center px-6">
            <textarea
              autoFocus
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              maxLength={500}
              placeholder="Type a status"
              rows={4}
              className="w-full resize-none bg-transparent text-center text-2xl font-semibold text-white placeholder-white/60 outline-none"
            />
          </div>
          <div className="flex justify-center gap-2 p-4">
            {BG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setBgColor(c)}
                className={`h-8 w-8 rounded-full border-2 ${bgColor === c ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {uploadProgress !== null && (
        <div className="fixed left-1/2 top-3 z-[70] w-[90%] max-w-xs -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 shadow-lg">
          <div className="flex items-center justify-between text-xs text-white">
            <span>Posting your status...</span>
            <span className="font-semibold">{uploadProgress}%</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {viewerOpenIndex !== null && (
        <StatusViewer
          groups={groups}
          startGroupIndex={viewerOpenIndex}
          currentUserId={user.id}
          onClose={() => {
            setViewerOpenIndex(null);
            load();
          }}
          onDeleted={() => load()}
        />
      )}
    </>
  );
}
