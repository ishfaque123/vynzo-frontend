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

  useEffect(() => {
    fetchDevices().then((result) => {
      if (result.success) setDevices(result.data.devices);
      setLoading(false);
    });
  }, []);

  async function handleLogout(id: string) {
    if (!confirm('Log out this device? It will need to sign in again.')) return;
    setBusyId(id);
    const result = await logoutDevice(id);
    setBusyId(null);
    if (result.success) setDevices((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleLogoutOthers() {
    if (!confirm('Log out of all other devices?')) return;
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
        <p className="text-slate-500">Loading...</p>
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
                    onClick={() => handleLogout(d.id)}
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
              onClick={handleLogoutOthers}
              disabled={busyAll}
              className="mt-4 w-full rounded-full bg-red-600 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {busyAll ? 'Logging out...' : 'Log out of all other devices'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
