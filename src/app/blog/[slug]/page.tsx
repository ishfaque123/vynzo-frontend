import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articles, getArticle } from '@/lib/blog';

const SITE_URL = 'https://www.frianzo.online';

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const url = `${SITE_URL}/blog/${article.slug}`;
  return {
    title: { absolute: `${article.title} | Frianzo Blog` },
    description: article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: 'article',
      url,
      title: article.title,
      description: article.description,
      siteName: 'Frianzo',
      publishedTime: article.date,
      images: [{ url: '/logo.png', alt: 'Frianzo logo' }],
    },
    twitter: {
      card: 'summary',
      title: article.title,
      description: article.description,
      images: ['/logo.png'],
    },
  };
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 3);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
    image: `${SITE_URL}/logo.png`,
    author: { '@type': 'Organization', name: 'Frianzo', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Frianzo',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <p className="mb-4 text-sm">
        <Link href="/blog" className="text-sky-700 hover:underline">
          ← All articles
        </Link>
      </p>

      <h1 className="mb-2 text-3xl font-bold leading-tight text-slate-900">
        {article.title}
      </h1>
      <p className="mb-8 text-xs uppercase tracking-wide text-slate-400">
        {formatDate(article.date)} · {article.readingMinutes} min read · By the
        Frianzo team
      </p>

      {article.sections.map((section, i) => (
        <section key={i}>
          {section.heading && (
            <h2 className="mb-2 mt-8 text-lg font-semibold text-slate-900">
              {section.heading}
            </h2>
          )}
          {section.paragraphs.map((p, j) => (
            <p key={j} className="mb-4">
              {p}
            </p>
          ))}
        </section>
      ))}

      <div className="mt-12 rounded-lg bg-slate-950 px-6 py-6 text-white">
        <p className="mb-1 text-lg font-bold">Try Frianzo today</p>
        <p className="mb-4 text-sm text-slate-300">
          Posts, reels, stories and real conversations — Pakistan&apos;s own
          social app, free on Google Play.
        </p>
        <a
          href="https://play.google.com/store/apps/details?id=com.frianzo.app"
          className="inline-block rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200"
        >
          Get the app
        </a>
      </div>

      <h2 className="mb-3 mt-12 text-lg font-semibold text-slate-900">
        More from the blog
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        {others.map((a) => (
          <li key={a.slug}>
            <Link href={`/blog/${a.slug}`} className="text-sky-700 hover:underline">
              {a.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
