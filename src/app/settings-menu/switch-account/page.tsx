'use client';

import { useEffect, useState } from 'react';
import { fetchMe, getSavedAccounts, switchAccountRequest } from '@/lib/api/authApi';

interface Account {
  id: string;
  username: string | null;
  displayName: string | null;
  profilePictureUrl: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function SwitchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

export default function SwitchAccountPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [me, list] = await Promise.all([fetchMe(), getSavedAccounts()]);
      setActiveId(me?.data?.user?.id ?? null);
      setAccounts(list?.data?.accounts ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSelect(accountId: string) {
    setSwitching(accountId);
    const result = await switchAccountRequest(accountId);
    if (result?.success) {
      // Full reload (not router.push) so Shell's useAuth, the bottom-nav
      // profile link, and the socket connection all re-initialize with the
      // new account's session instead of holding onto stale state.
      window.location.href = '/';
    } else {
      setSwitching(null);
    }
  }

  function handleAddAccount() {
    window.location.href = `${API_URL}/api/auth/google/start?switch=1`;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <SwitchIcon />
        </div>
        <h1 className="text-lg font-semibold">Switch account</h1>
      </div>

      {loading ? (
        <p className="text-center text-sm text-slate-500">Loading accounts...</p>
      ) : (
        <div className="mb-4 divide-y rounded-lg border">
          {accounts.map((acc) => {
            const isActive = acc.id === activeId;
            return (
              <button
                key={acc.id}
                onClick={() => !isActive && handleSelect(acc.id)}
                disabled={isActive || switching === acc.id}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-60"
              >
                <span className="h-9 w-9 overflow-hidden rounded-full bg-slate-200">
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
                {switching === acc.id && <span className="text-xs text-slate-400">Switching...</span>}
              </button>
            );
          })}
          {accounts.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-500">No saved accounts yet.</p>
          )}
        </div>
      )}

      <button
        onClick={handleAddAccount}
        className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white"
      >
        + Add another account
      </button>
    </div>
  );
}
