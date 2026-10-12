'use client';

import { useEffect, useState } from 'react';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12.5" /><circle cx="12" cy="16" r="0.5" fill="currentColor" />
    </svg>
  );
}

export default function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide-up animation on mount
    const show = requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 200);
    }, 2200);
    return () => { cancelAnimationFrame(show); clearTimeout(t); };
  }, [onClose]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-6">
      <div
        onClick={() => { setVisible(false); setTimeout(onClose, 200); }}
        className={`pointer-events-auto flex max-w-xs items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium text-white shadow-xl transition-all duration-200 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        } ${type === 'success' ? 'bg-neutral-900/95 backdrop-blur' : 'bg-red-600/95 backdrop-blur'}`}
      >
        <span className={type === 'success' ? 'text-emerald-400' : 'text-white'}>
          {type === 'success' ? <CheckIcon /> : <AlertIcon />}
        </span>
        <span className="truncate">{message}</span>
      </div>
    </div>
  );
}
