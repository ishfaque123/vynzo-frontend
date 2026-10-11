'use client';

/** Professional SVG icons for story stickers (no emoji characters). */

export function StickerFaceIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
      <circle cx="9" cy="9.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PollIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="5" y1="20" x2="5" y2="12" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="19" y1="20" x2="19" y2="9" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  );
}

export function QuestionIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.3c.2-1.4 1.2-2.3 2.5-2.3 1.4 0 2.5 1 2.5 2.3 0 1.7-2.2 2-2.4 3.4" />
      <circle cx="12" cy="16.8" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CountdownIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.5 1.5" />
      <path d="M9.5 2.5h5" />
      <path d="M12 2.5V5.5" />
    </svg>
  );
}

export function LinkIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13.5a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.7 1.7" />
      <path d="M14 10.5a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.7-1.7" />
    </svg>
  );
}

export function StickerTypeIcon({ type, size = 20 }: { type: 'poll' | 'question' | 'countdown' | 'link'; size?: number }) {
  if (type === 'poll') return <PollIcon size={size} />;
  if (type === 'question') return <QuestionIcon size={size} />;
  if (type === 'countdown') return <CountdownIcon size={size} />;
  return <LinkIcon size={size} />;
}
