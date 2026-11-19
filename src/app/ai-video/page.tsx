'use client';

import { useRouter } from 'next/navigation';

function BackIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function SparklesIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" /></svg>;
}

// AI Video Generator DISABLED (owner order 2026-11-19): the tool is
// switched off, so this page is only a notice for saved/deep links.
// The backend also refuses generation (403 AI_VIDEO_DISABLED), and the
// drawer entry that led here has been removed from Shell.tsx.
// To re-enable, restore the previous version of this page from git.
export default function AiVideoPage() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => router.back()} aria-label="Back" className="p-2 text-slate-900">
          <BackIcon />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-violet-600"><SparklesIcon /></span>
          <h1 className="text-lg font-bold text-slate-900">AI Video Generator</h1>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <h2 className="font-semibold text-slate-900">This tool is currently unavailable</h2>
        <p className="mt-1 text-sm text-slate-500">
          AI video generation has been switched off. Please check back later.
        </p>
      </div>
    </div>
  );
}
