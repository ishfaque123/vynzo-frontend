'use client';

import { useState } from 'react';
import Link from 'next/link';

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
function BlockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}
function DeviceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="7" y="2" width="10" height="20" rx="2" /><line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}
function ThemeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

const items = [
  { label: 'Edit Profile', href: '/settings', Icon: EditIcon },
  { label: 'Blocked Accounts', href: '/settings-menu/blocked', Icon: BlockIcon },
  { label: 'Devices', href: '/settings-menu/devices', Icon: DeviceIcon },
  { label: 'Theme', href: '/settings-menu/theme', Icon: ThemeIcon },
  { label: 'Comments', href: '/settings-menu/comments', Icon: CommentIcon },
];

export default function SecurityPage() {
  const [privacySheetOpen, setPrivacySheetOpen] = useState(false);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Login &amp; Security</h1>
      <div className="mb-3 divide-y rounded-lg border">
        <button
          onClick={() => setPrivacySheetOpen(true)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
        >
          <span className="text-slate-600"><LockIcon /></span>
          <span className="text-slate-800">Account Privacy</span>
        </button>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
          >
            <span className="text-slate-600"><item.Icon /></span>
            <span className="text-slate-800">{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="rounded-lg border">
        <Link
          href="/settings-menu/delete-account"
          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
        >
          <span className="text-red-600"><TrashIcon /></span>
          <span className="font-medium text-red-600">Delete Account</span>
        </Link>
      </div>

      {privacySheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setPrivacySheetOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-center text-sm font-semibold text-slate-800">Account Privacy</p>
            <div className="mb-4 rounded-lg border px-4 py-6 text-center text-sm text-slate-500">
              This feature is coming soon.
            </div>
            <button
              onClick={() => setPrivacySheetOpen(false)}
              className="w-full rounded-full border py-2.5 text-sm font-medium text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
