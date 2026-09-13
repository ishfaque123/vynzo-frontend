'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';

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

export default function AccountPrivacyPage() {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [messagePermission, setMessagePermission] = useState('everyone');
  const [tagPermission, setTagPermission] = useState('everyone');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPhone(user.phone || '');
    setMessagePermission(user.messagePermission || 'everyone');
    setTagPermission(user.tagPermission || 'everyone');
    setShowOnlineStatus(user.showOnlineStatus !== false);
  }, [user]);

  async function saveField(data: any) {
    setSaved(false);
    const result = await patchMe(data);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-4 pb-20">
      <h1 className="mb-4 text-lg font-semibold">Account Privacy</h1>

      <Row label="WhatsApp Number">
        <div className="flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +923001234567"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            onClick={() => saveField({ phone })}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Save
          </button>
        </div>
      </Row>

      <Row label="Who can message me">
        <RadioGroup
          value={messagePermission}
          onChange={(v) => { setMessagePermission(v); saveField({ messagePermission: v }); }}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'followers', label: 'People I follow' },
            { value: 'none', label: 'No one' },
          ]}
        />
      </Row>

      <Row label="Who can tag me">
        <RadioGroup
          value={tagPermission}
          onChange={(v) => { setTagPermission(v); saveField({ tagPermission: v }); }}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'followers', label: 'People I follow' },
            { value: 'none', label: 'No one' },
          ]}
        />
      </Row>

      <Row label="Online status">
        <label className="flex items-center justify-between text-sm text-slate-700">
          Show when I'm active / last seen
          <input
            type="checkbox"
            checked={showOnlineStatus}
            onChange={(e) => { setShowOnlineStatus(e.target.checked); saveField({ showOnlineStatus: e.target.checked }); }}
          />
        </label>
      </Row>

      <Link href="/settings-menu/comments" className="block border-b py-3 text-sm font-medium text-slate-700">
        Comments →
      </Link>
      <Link href="/settings-menu/blocked" className="block border-b py-3 text-sm font-medium text-slate-700">
        Blocked Accounts →
      </Link>

      {saved && <p className="mt-3 text-center text-xs text-green-600">Saved</p>}
    </div>
  );
}
