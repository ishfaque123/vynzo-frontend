'use client';

import { useEffect, useState } from 'react';
import { fetchUsagePings } from '@/lib/api/usageApi';

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function ActivityPage() {
  const [loading, setLoading] = useState(true);
  const [hourly, setHourly] = useState<number[]>(Array(24).fill(0));
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    fetchUsagePings(startOfDay.toISOString(), now.toISOString()).then((res) => {
      if (res.success) {
        const counts = Array(24).fill(0);
        for (const iso of res.data.pings as string[]) {
          const hour = new Date(iso).getHours();
          counts[hour] += 1;
        }
        setHourly(counts);
        setTotal(counts.reduce((a: number, b: number) => a + b, 0));
      }
      setLoading(false);
    });
  }, []);

  const max = Math.max(1, ...hourly);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">Your Activity</h1>
      <p className="mb-4 text-sm text-slate-500">How much time you've spent on Friendzo today.</p>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="mb-6 rounded-lg border bg-white p-4">
            <p className="text-xs text-slate-500">Today</p>
            <p className="text-2xl font-semibold text-slate-900">{formatDuration(total)}</p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <p className="mb-3 text-xs font-medium text-slate-500">Time of day</p>
            <div className="flex h-32 items-end gap-0.5">
              {hourly.map((v, hour) => (
                <div key={hour} className="flex-1" title={`${hour}:00 - ${formatDuration(v)}`}>
                  <div
                    className="rounded-t bg-blue-500"
                    style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? '3px' : '0px' }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>12AM</span>
              <span>6AM</span>
              <span>12PM</span>
              <span>6PM</span>
              <span>11PM</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
