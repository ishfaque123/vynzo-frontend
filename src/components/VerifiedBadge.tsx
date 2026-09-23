export default function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-5 w-5 text-[11px]' : size === 'md' ? 'h-4 w-4 text-[10px]' : 'h-4 w-4 text-[9px]';
  return <span title="Verified" aria-label="Verified" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-blue-500 font-bold text-white ${sizeClass}`}>✓</span>;
}
