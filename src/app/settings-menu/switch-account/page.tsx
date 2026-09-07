'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchSavedAccounts,
  switchSavedAccount,
  type SavedAccount,
} from '@/lib/api/authApi';

function SwitchIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

function AccountAvatar({ account }: { account: SavedAccount }) {
  if (account.profilePictureUrl) {
    return (
      <img
        src={account.profilePictureUrl}
        alt=""
        className="h-12 w-12 rounded-full object-cover"
      />
    );
  }

  const name = account.displayName || account.username || 'U';

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function SwitchAccountPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    fetchSavedAccounts()
      .then((result) => {
        if (!mounted) return;

        if (!result.success) {
          setError(result.error?.message || 'Could not load saved accounts.');
          return;
        }

        setAccounts(result.data.accounts || []);
      })
      .catch(() => {
        if (mounted) {
          setError('Could not load saved accounts.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSwitch(accountId: string) {
    if (switchingId) return;

    setSwitchingId(accountId);
    setError('');

    try {
      const result = await switchSavedAccount(accountId);

      if (!result.success) {
        setError(result.error?.message || 'Could not switch account.');
        setSwitchingId(null);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Could not switch account. Please try again.');
      setSwitchingId(null);
    }
  }

  function handleAddAccount() {
    router.push('/login?add=1');
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <SwitchIcon />
        </div>

        <h1 className="mb-2 text-lg font-semibold">Switch account</h1>

        <p className="text-sm text-slate-500">
          Choose a saved account or add another account.
        </p>
      </div>

      {error && (
        <p className="mb-4 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Loading accounts...
        </p>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => handleSwitch(account.id)}
              disabled={switchingId !== null}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50 disabled:opacity-60"
            >
              <AccountAvatar account={account} />

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {account.displayName || account.username || 'Vynzo user'}
                </p>

                {account.username && (
                  <p className="truncate text-sm text-slate-500">
                    @{account.username}
                  </p>
                )}
              </div>

              {switchingId === account.id && (
                <span className="text-sm text-slate-500">
                  Switching...
                </span>
              )}
            </button>
          ))}

          <button
            type="button"
            onClick={handleAddAccount}
            disabled={switchingId !== null}
            className="w-full rounded-xl border border-dashed border-slate-300 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            + Add account
          </button>
        </div>
      )}
    </div>
  );
}
