export default function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <span title="Verified" aria-label="Verified" className={`inline-flex shrink-0 items-center justify-center ${sizeClass}`}>
      <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#0095f6" />
        <path d="M8 12.5l2.5 2.5L16.5 9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
