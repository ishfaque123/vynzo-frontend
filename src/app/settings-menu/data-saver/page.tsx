'use client';

import { useDataSaver, setDataSaver } from '@/lib/dataSaver';

function DataSaverIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M2 12h20" strokeWidth="0" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export default function DataSaverPage() {
  const enabled = useDataSaver();

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">Data Saver</h1>
      <p className="mb-4 text-sm text-slate-500">
        Use less mobile data. Videos won't play automatically — tap any reel to play it.
      </p>
      <div className="divide-y rounded-lg border">
        <button
          type="button"
          onClick={() => setDataSaver(!enabled)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          aria-pressed={enabled}
        >
          <span className="flex items-center gap-3">
            <span className="text-slate-600"><DataSaverIcon /></span>
            <span>
              <span className="block font-medium text-slate-900">Data Saver</span>
              <span className="block text-xs text-slate-500">{enabled ? 'On — tap to play videos' : 'Off'}</span>
            </span>
          </span>
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </span>
        </button>
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        <p className="mb-1 font-medium text-slate-800">When Data Saver is on:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Reels show a thumbnail — tap to play the video</li>
          <li>Videos never download until you tap them</li>
          <li>Photos and text work normally</li>
        </ul>
      </div>
    </div>
  );
}
