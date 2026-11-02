'use client';

import { useEffect, useState } from 'react';
import { fetchDevices, logoutDevice, logoutOtherDevices } from '@/lib/api/deviceApi';
import { DeviceIcon } from '@/components/icons/UiIcons';

interface Device {
  id: string;
  label: string;
  location: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
}

function formatTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Active now';
  if (mins < 60) return `Active ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Active ${days}d ago`;
  return `Active on ${new Date(dateStr).toLocaleDateString()}`;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const [pending, setPending] = useState<{ type: 'single'; id: string; label: string } | { type: 'all' } | null>(null);

  useEffect(() => {
    fetchDevices().then((result) => {
      if (result.success) setDevices(result.data.devices);
      setLoading(false);
    });
  }, []);

  async function handleLogout(id: string) {
    setPending(null);
    setBusyId(id);
    const result = await logoutDevice(id);
    setBusyId(null);
    if (result.success) setDevices((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleLogoutOthers() {
    setPending(null);
    setBusyAll(true);
    const result = await logoutOtherDevices();
    setBusyAll(false);
    if (result.success) setDevices((prev) => prev.filter((d) => d.isCurrent));
  }

  const others = devices.filter((d) => !d.isCurrent);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">Devices</h1>
      <p className="mb-4 text-sm text-slate-500">Places where you're currently logged in.</p>

      {loading ? (
        <div className="flex justify-center py-6" role="status" aria-label="Loading devices"><div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" /></div>
      ) : devices.length === 0 ? (
        <p className="text-slate-500">No active sessions found.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg border bg-white p-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <DeviceIcon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{d.label}</p>
                    {d.isCurrent && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        This device
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {d.location ? `${d.location} · ` : ''}
                    {formatTime(d.lastActiveAt)}
                  </p>
                </div>
                {!d.isCurrent && (
                  <button
                    onClick={() => setPending({ type: 'single', id: d.id, label: d.label })}
                    disabled={busyId === d.id}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-40"
                  >
                    {busyId === d.id ? '...' : 'Log out'}
                  </button>
                )}
              </div>
            ))}
          </div>

          {others.length > 0 && (
            <button
              onClick={() => setPending({ type: 'all' })}
              disabled={busyAll}
              className="mt-4 w-full rounded-full bg-red-600 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {busyAll ? 'Logging out...' : 'Log out of all other devices'}
            </button>
          )}
        </>
      )}

      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-5" onClick={() => setPending(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-base font-semibold text-slate-900">
              {pending.type === 'all' ? 'Log out of all other devices?' : 'Log out this device?'}
            </h2>
            <p className="mb-4 text-sm leading-6 text-slate-700">
              {pending.type === 'all'
                ? 'All other devices will need to sign in again. This device will stay signed in.'
                : `${pending.label} will need to sign in again.`}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPending(null)} className="flex-1 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button
                type="button"
                onClick={() => void (pending.type === 'all' ? handleLogoutOthers() : handleLogout(pending.id))}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
