import Skeleton from './Skeleton';

export default function SkeletonNotificationRow() {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-white px-3 py-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  );
}
