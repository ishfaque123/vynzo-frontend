'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const SEE_MORE_LIMIT = 280;

export default function PostContent({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowsLines, setOverflowsLines] = useState(false);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const isLong = text.length > SEE_MORE_LIMIT;
  // Truncate at a word boundary for a clean cut
  const truncated = isLong
    ? text.slice(0, SEE_MORE_LIMIT).replace(/\s+\S*$/, '') + '\u2026'
    : text;
  const displayText = expanded || !isLong ? text : truncated;
  const parts = displayText.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const copiedRef = useRef(false);

  // Show the toggle when the text is over the character limit OR over
  // 5 rendered lines. A short text with many blank lines can be taller
  // than a long single-paragraph text, so the character limit alone
  // misses it (e.g. ~165 chars over ~17 visual lines).
  const showToggle = isLong || overflowsLines;

  // While collapsed the text span below is clamped to 5 lines, so
  // scrollHeight > clientHeight means lines are hidden. Only measured
  // while collapsed: once expanded there is no clamp, so a measurement
  // there would always read "no overflow" and hide the "See less" toggle.
  useEffect(() => {
    if (expanded) return;
    const el = textRef.current;
    if (!el) return;
    setOverflowsLines(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  const handleCopy = async () => {
    if (copiedRef.current) return;
    copiedRef.current = true;
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
    // Reset guard after a short delay so a new long-press can copy again
    setTimeout(() => { copiedRef.current = false; }, 1000);
  };

  const startPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    copiedRef.current = false;
    timerRef.current = setTimeout(handleCopy, 500);
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <p
      className={className}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={endPress}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span ref={textRef} className={expanded ? undefined : 'line-clamp-5'}>
        {parts.map((part, i) => {
          if (/^#[a-zA-Z0-9_]+$/.test(part)) {
            const tag = part.slice(1);
            return (
              <Link
                key={i}
                href={`/tag/${tag}`}
                className="font-medium text-blue-600"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {part}
              </Link>
            );
          }
          return /^[#@][a-zA-Z0-9_]+$/.test(part)
            ? <span key={i} className="font-medium text-blue-600">{part}</span>
            : <span key={i}>{part}</span>;
        })}
      </span>
      {showToggle && (
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="font-medium text-slate-500 hover:text-slate-700"
        >
          {expanded ? ' See less' : ' See more'}
        </button>
      )}
    </p>
  );
}
