// Instant shell for reels navigation (Next.js App Router). Mirrors the
// reels screen itself — tabs on top, loading dots in the video area, and
// skeleton placeholders for the action rail and caption — so opening
// Reels feels instant and the real screen takes over seamlessly.
import Skeleton from '@/components/Skeleton';

export default function ReelsLoading() {
  return (
    <div className="relative h-[100dvh] bg-black">
      <div className="relative mx-auto h-full w-full max-w-[480px]">
        <div className="absolute left-0 right-0 top-0 flex items-center justify-center gap-6 pt-3">
          <span className="pb-1 text-[15px] font-semibold text-white/50">Following</span>
          <span className="pb-1 text-[15px] font-semibold text-white">
            For You
            <span className="mx-auto mt-0.5 block h-0.5 w-6 rounded-full bg-white" />
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2" aria-hidden="true">
            <svg className="h-2.5 w-2.5 animate-bounce" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="#ffffff" /></svg>
            <svg className="h-2.5 w-2.5 animate-bounce [animation-delay:150ms]" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="#ffffff" /></svg>
            <svg className="h-2.5 w-2.5 animate-bounce [animation-delay:300ms]" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="#ffffff" /></svg>
          </div>
        </div>
        <div className="absolute bottom-28 right-3 flex flex-col items-center gap-5">
          <div className="relative">
            <Skeleton className="h-11 w-11 rounded-full bg-white/15" />
            
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-11 w-11 rounded-full bg-white/15" />
              <Skeleton className="h-2 w-7 bg-white/15" />
            </div>
          ))}
        </div>
        <div className="absolute bottom-24 left-3 flex max-w-[70%] flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full bg-white/15" />
            <Skeleton className="h-3 w-24 bg-white/15" />
          </div>
          <Skeleton className="h-3 w-48 bg-white/15" />
          <Skeleton className="h-3 w-36 bg-white/15" />
        </div>
      </div>
    </div>
  );
}
