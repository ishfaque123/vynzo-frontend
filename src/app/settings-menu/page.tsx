'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutRequest, fetchMe, getSavedAccounts, switchAccountRequest } from '@/lib/api/authApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Account {
  id: string;
  username: string | null;
  displayName: string | null;
  profilePictureUrl: string | null;
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
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
function SwitchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
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
function PowerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18.36 6.64a9 9 0 11-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
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

const menuItems = [
  { label: 'Professional Dashboard', href: '/settings-menu/dashboard', Icon: ChartIcon },
  { label: 'Close Friends', href: '/settings-menu/close-friends', Icon: StarIcon },
  { label: 'Login & Security', href: '/settings-menu/security', Icon: ShieldIcon },
];

export default function SettingsMenuPage() {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [switchSheetOpen, setSwitchSheetOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  async function openSwitchSheet() {
    setSwitchSheetOpen(true);
    setAccountsLoading(true);
    const [me, list] = await Promise.all([fetchMe(), getSavedAccounts()]);
    setActiveId(me?.data?.user?.id ?? null);
    setAccounts(list?.data?.accounts ?? []);
    setAccountsLoading(false);
  }

  async function handleSelectAccount(accountId: string) {
    setSwitchingId(accountId);
    const result = await switchAccountRequest(accountId);
    if (result?.success) {
      window.location.href = '/';
    } else {
      setSwitchingId(null);
    }
  }

  function handleAddAccount() {
    window.location.href = `${API_URL}/api/auth/google/start?switch=1`;
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logoutRequest();
    router.push('/login');
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>
      <div className="mb-3 divide-y rounded-lg border">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
          >
            <span className="text-slate-600"><item.Icon /></span>
            <span className="text-slate-800">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={openSwitchSheet}
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
        >
          <span className="text-slate-600"><SwitchIcon /></span>
          <span className="text-slate-800">Switch / Add Account</span>
        </button>
      </div>

      <div className="mb-3 divide-y rounded-lg border">
        <button onClick={() => setShowLogoutConfirm(true)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
          <span className="text-red-600"><PowerIcon /></span>
          <span className="font-medium text-red-600">Logout</span>
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="w-full max-w-xs rounded-xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <p className="mb-1 font-semibold">Log out?</p>
            <p className="mb-4 text-sm text-slate-500">You'll need to sign in again to use Friendzo.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-lg border py-2 text-sm font-medium">Cancel</button>
              <button onClick={handleLogout} disabled={loggingOut} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-50">
                {loggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {switchSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setSwitchSheetOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-center text-sm font-semibold text-slate-800">Switch account</p>

            {accountsLoading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading accounts...</p>
            ) : (
              <div className="mb-3 max-h-[45vh] divide-y overflow-y-auto rounded-lg border">
                {accounts.map((acc) => {
                  const isActive = acc.id === activeId;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => !isActive && handleSelectAccount(acc.id)}
                      disabled={isActive || switchingId === acc.id}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-60"
                    >
                      <span className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                        {acc.profilePictureUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={acc.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-slate-800">
                          {acc.displayName || acc.username || 'Vynzo user'}
                        </span>
                        {acc.username && <span className="block text-xs text-slate-500">@{acc.username}</span>}
                      </span>
                      {isActive && <span className="text-xs font-medium text-slate-400">Active</span>}
                      {switchingId === acc.id && <span className="text-xs text-slate-400">Switching...</span>}
                    </button>
                  );
                })}
                {accounts.length === 0 && (
                  <p className="px-4 py-3 text-sm text-slate-500">No saved accounts yet.</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSwitchSheetOpen(false)}
                className="flex-1 rounded-full border py-2.5 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                className="flex-1 rounded-full bg-slate-900 py-2.5 text-sm font-medium text-white"
              >
                + Add account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
