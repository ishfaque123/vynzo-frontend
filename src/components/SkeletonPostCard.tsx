import Skeleton from './Skeleton';

export default function SkeletonPostCard() {
  return (
    <div className="border-b-[8px] border-slate-100 bg-white p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <Skeleton className="mt-3 h-48 w-full" />
      <div className="mt-3 flex gap-4 pb-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}
