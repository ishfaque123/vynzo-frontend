// Instant loading shell for home-feed navigation (Next.js App Router).
// Buttons felt "frozen" on slow networks because no loading UI appeared
// while the feed data was fetched. This skeleton renders instantly on tap.
import SkeletonPostCard from '@/components/SkeletonPostCard';

export default function HomeLoading() {
  return (
    <div className="pb-20">
      <SkeletonPostCard />
      <SkeletonPostCard />
      <SkeletonPostCard />
    </div>
  );
}
