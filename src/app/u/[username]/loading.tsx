// Instant loading shell for profile navigation (Next.js App Router).
// Shows a profile-shaped skeleton immediately on tap so profile buttons
// never feel frozen while the profile data loads on slow networks.
import Skeleton from '@/components/Skeleton';
import SkeletonPostCard from '@/components/SkeletonPostCard';

export default function ProfileLoading() {
  return (
    <div className="pb-20">
      <div className="bg-white px-4 pb-4 pt-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
          <div className="flex flex-1 justify-around">
            <div className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="mt-4 h-9 w-full rounded-lg" />
      </div>
      <SkeletonPostCard />
      <SkeletonPostCard />
    </div>
  );
}
