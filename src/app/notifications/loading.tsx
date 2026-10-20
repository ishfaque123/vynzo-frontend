// Instant loading shell for notifications navigation (Next.js App Router).
// Renders notification-row skeletons immediately on tap so the button
// never feels frozen while the page chunk/data loads on slow networks.
import SkeletonNotificationRow from '@/components/SkeletonNotificationRow';

export default function NotificationsLoading() {
  return (
    <div className="flex flex-col gap-2 px-3 pb-20 pt-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonNotificationRow key={i} />
      ))}
    </div>
  );
}
