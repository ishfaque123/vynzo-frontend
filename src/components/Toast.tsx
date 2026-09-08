'use client';

import { useEffect } from 'react';

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12.5" /><circle cx="12" cy="16" r="0.5" fill="currentColor" />
    </svg>
  );
}

export default function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div
        className={`flex max-w-sm items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white shadow-lg ${
          type === 'success' ? 'bg-slate-900' : 'bg-red-600'
        }`}
        onClick={onClose}
      >
        {type === 'success' ? <CheckIcon /> : <AlertIcon />}
        <span>{message}</span>
      </div>
    </div>
  );
}
