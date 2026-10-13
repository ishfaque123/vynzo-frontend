'use client';

import { useDataSaver, setDataSaver } from '@/lib/dataSaver';

export default function DataSaverPage() {
  const enabled = useDataSaver();

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Data Saver</h1>
      <div className="divide-y rounded-lg border">
        <button
          type="button"
          onClick={() => setDataSaver(!enabled)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          aria-pressed={enabled}
        >
          <span className="font-medium text-slate-900">Data Saver</span>
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
