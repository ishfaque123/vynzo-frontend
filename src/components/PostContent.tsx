'use client';

import { useRef, useState } from 'react';

export default function PostContent({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startPress = () => {
    timerRef.current = setTimeout(handleCopy, 500);
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <>
      <p
        className={className}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchMove={endPress}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onContextMenu={(e) => e.preventDefault()}
      >
        {parts.map((part, i) =>
          /^[#@][a-zA-Z0-9_]+$/.test(part)
            ? <span key={i} className="font-medium text-blue-600">{part}</span>
            : <span key={i}>{part}</span>
        )}
      </p>
      {copied && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
            Copied
          </div>
        </div>
      )}
    </>
  );
}
