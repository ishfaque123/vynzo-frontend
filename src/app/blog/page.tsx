import Link from 'next/link';
import { articles } from '@/lib/blog';
import { AdsterraBanner } from '@/components/Adsterra';

export const metadata = {
  title: 'Blog | Frianzo',
  description:
    'Guides, tips and stories from the Frianzo team — grow your followers, make better reels, understand the feed, stay safe, and get more from Pakistan\'s own social app.',
  alternates: { canonical: '/blog' },
};

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function BlogIndexPage() {
  const sorted = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-slate-700">
      <h1 className="mb-3 text-3xl font-bold text-slate-900">The Frianzo Blog</h1>
      <p className="mb-10">
        Guides and honest advice from the Frianzo team — how the feed works, how
        to grow as a creator, how referrals and verification work, and how to
        keep your account safe. Written for our community in Pakistan and beyond.
      </p>

      <div className="space-y-8">
        {sorted.map((a) => (
          <article key={a.slug} className="border-b border-slate-200 pb-8">
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
              {formatDate(a.date)} · {a.readingMinutes} min read
            </p>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              <Link href={`/blog/${a.slug}`} className="hover:underline">
                {a.title}
              </Link>
            </h2>
            <p className="mb-3">{a.description}</p>
            <Link
              href={`/blog/${a.slug}`}
              className="text-sm font-medium text-sky-700 hover:underline"
            >
              Read article →
            </Link>
          </article>
        ))}
      </div>

      {/* Adsterra leaderboard slot (728x90, placement 31872375). Renders
          nothing until the real snippet is pasted into
          src/lib/adsterraSnippets.ts. */}
      <AdsterraBanner size="728x90" className="mt-10 flex justify-center" />

      <p className="mt-10 text-sm text-slate-500">
        New here?{' '}
        <a
          href="https://play.google.com/store/apps/details?id=com.frianzo.app"
          className="font-medium text-sky-700 hover:underline"
        >
          Download Frianzo free on Google Play
        </a>{' '}
        and put these guides to work.
      </p>
    </div>
  );
}
