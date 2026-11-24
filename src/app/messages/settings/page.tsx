'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { uploadChatMedia } from '@/lib/api/messageApi';
import { CHAT_WALLPAPERS, chatWallpaperSwatchStyle } from '@/lib/chatWallpapers';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function patchMe(data: any) {
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b py-3">
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      {children}
    </div>
  );
}

function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
          <input type="radio" checked={value === opt.value} onChange={() => onChange(opt.value)} />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-slate-300'}`}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

// Radio values are strings in the UI; the stored setting is seconds or null (Off).
const DISAPPEARING_OPTIONS: { value: string; label: string; stored: number | null }[] = [
  { value: 'off', label: 'Off', stored: null },
  { value: '86400', label: '24 hours', stored: 86400 },
  { value: '604800', label: '7 days', stored: 604800 },
  { value: '7776000', label: '90 days', stored: 7776000 },
];

export default function MessageSettingsPage() {
  const { user } = useAuth();
  const [messagePermission, setMessagePermission] = useState('everyone');
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [disappearing, setDisappearing] = useState('86400');
  const [wallpaper, setWallpaper] = useState('default');
  const [wallpaperUploading, setWallpaperUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setMessagePermission(user.messagePermission || 'everyone');
    setReadReceiptsEnabled(user.readReceiptsEnabled !== false);
    setShowOnlineStatus(user.showOnlineStatus !== false);
    const stored = user.defaultDisappearingDuration === undefined ? 86400 : user.defaultDisappearingDuration;
    setDisappearing(stored === null ? 'off' : String(stored));
    setWallpaper(user.chatWallpaper || 'default');
  }, [user]);

  async function saveField(data: any) {
    setSaved(false);
    const result = await patchMe(data);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  function saveDisappearing(uiValue: string) {
    setDisappearing(uiValue);
    const option = DISAPPEARING_OPTIONS.find((o) => o.value === uiValue);
    saveField({ defaultDisappearingDuration: option ? option.stored : 86400 });
  }

  function saveWallpaper(value: string) {
    setWallpaper(value);
    saveField({ chatWallpaper: value === 'default' ? 'default' : value });
  }

  async function handleWallpaperPhoto(file: File) {
    setWallpaperUploading(true);
    const result = await uploadChatMedia(file, file.name);
    setWallpaperUploading(false);
    if (result.success && result.data?.url) {
      saveWallpaper(result.data.url);
    }
  }

  const wallpaperIsPhoto = wallpaper.startsWith('http');

  return (
    <div className="mx-auto max-w-xl px-4 py-4 pb-20">
      <Link href="/messages" className="mb-3 block text-sm font-medium text-slate-500">
        ← Messages
      </Link>
      <h1 className="mb-4 text-lg font-semibold">Message Settings</h1>

      <Row label="Who can message me">
        <RadioGroup
          value={messagePermission}
          onChange={(v) => { setMessagePermission(v); saveField({ messagePermission: v }); }}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'followers', label: 'Followers only' },
            { value: 'none', label: 'No one' },
          ]}
        />
        <p className="mt-2 text-xs text-slate-400">
          With Everyone, messages from people you don't follow arrive as message requests.
        </p>
      </Row>

      <Row label="Read receipts">
        <label className="flex items-center justify-between text-sm text-slate-700">
          Let others see when you've read their messages
          <ToggleSwitch
            checked={readReceiptsEnabled}
            onChange={(v) => { setReadReceiptsEnabled(v); saveField({ readReceiptsEnabled: v }); }}
          />
        </label>
      </Row>

      <Row label="Online status">
        <label className="flex items-center justify-between text-sm text-slate-700">
          Show when I'm active / last seen
          <ToggleSwitch
            checked={showOnlineStatus}
            onChange={(v) => { setShowOnlineStatus(v); saveField({ showOnlineStatus: v }); }}
          />
        </label>
      </Row>

      <Row label="Disappearing messages timer">
        <RadioGroup
          value={disappearing}
          onChange={saveDisappearing}
          options={DISAPPEARING_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <p className="mt-2 text-xs text-slate-400">Default for new chats. Existing chats keep their own timer.</p>
      </Row>

      <Row label="Chat wallpaper">
        <div className="grid grid-cols-3 gap-3">
          {CHAT_WALLPAPERS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => saveWallpaper(w.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 ${wallpaper === w.id ? 'border-green-500' : 'border-transparent'}`}
            >
              <span className="h-16 w-full rounded-lg border border-slate-200" style={chatWallpaperSwatchStyle(w)} />
              <span className="text-xs font-medium text-slate-700">{w.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={wallpaperUploading}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 disabled:opacity-50 ${wallpaperIsPhoto ? 'border-green-500' : 'border-transparent'}`}
          >
            {wallpaperIsPhoto ? (
              <span
                className="h-16 w-full rounded-lg border border-slate-200"
                style={{ backgroundImage: `url("${wallpaper}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
            ) : (
              <span className="flex h-16 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-2xl text-slate-400">+</span>
            )}
            <span className="text-xs font-medium text-slate-700">{wallpaperUploading ? 'Uploading...' : 'Your photo'}</span>
          </button>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleWallpaperPhoto(file);
            e.target.value = '';
          }}
        />
        <p className="mt-2 text-xs text-slate-400">Applies to all chats. A wallpaper set inside a single chat still wins for that chat.</p>
      </Row>

      <Link href="/settings-menu/blocked" className="block border-b py-3 text-sm font-medium text-slate-700">
        Blocked users →
      </Link>
      <Link href="/settings-menu/theme" className="block border-b py-3 text-sm font-medium text-slate-700">
        Chat theme →
      </Link>

      {saved && <p className="mt-3 text-center text-xs text-green-600">Saved</p>}
    </div>
  );
}
