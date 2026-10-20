// Instant loading shell for reels navigation (Next.js App Router).
// The reels screen is dark/full-screen; this keeps the tap feeling alive
// with a matching dark placeholder instead of a dead-looking pause.
import Skeleton from '@/components/Skeleton';

export default function ReelsLoading() {
  return (
    <div className="flex h-[100dvh] flex-col justify-end bg-black pb-24">
      <div className="flex items-end justify-between px-3">
        <div className="flex max-w-[75%] flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
            <Skeleton className="h-3 w-24 bg-white/20" />
          </div>
          <Skeleton className="h-3 w-48 bg-white/20" />
          <Skeleton className="h-3 w-36 bg-white/20" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
          <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
          <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}
