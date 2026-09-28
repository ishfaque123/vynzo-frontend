import Link from 'next/link';
import NativeRedirect from './NativeRedirect';

export default function PublicLanding() {
  const features = [
    { title: 'Posts & Photos', text: 'Share text, photos and everyday moments with the people you follow.', icon: '✦' },
    { title: 'Reels', text: 'Watch and discover short-form videos directly in your social feed.', icon: '▶' },
    { title: 'Stories', text: 'Share quick updates and moments that stay fresh and easy to discover.', icon: '◌' },
    { title: 'Comments & Replies', text: 'Join conversations with comments and replies on posts.', icon: '↩' },
    { title: 'Profiles & Follow', text: 'Discover people, explore profiles and follow accounts you care about.', icon: '◎' },
    { title: 'Reactions', text: 'React to posts and see how the community responds to shared content.', icon: '♡' },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <NativeRedirect />
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_42%),radial-gradient(circle_at_15%_20%,_rgba(59,130,246,0.10),_transparent_35%)]" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-blue-600 shadow-sm">
              <img src="/logo.png" alt="Frianzo" className="h-full w-full object-cover" />
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-blue-600">Frianzo</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-blue-600">Features</a>
            <a href="#about" className="transition hover:text-blue-600">About</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Log in
            </Link>
            <Link href="/login" className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Sign up
            </Link>
          </div>
        </header>

        <section id="about" className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28 lg:pt-20">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Your social space
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-6xl">
              Connect. Share. <span className="text-blue-600">Discover.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Frianzo is a social platform for sharing posts, photos, stories and reels,
              discovering people, following profiles and joining conversations through comments and reactions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="rounded-full bg-blue-600 px-7 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                Create Account
              </Link>
              <Link href="/login" className="rounded-full border border-slate-200 bg-white px-7 py-3.5 text-center text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                Log in
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500">Join Frianzo from the web — no app install required.</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-blue-100/60 blur-2xl" />
            <div className="mx-auto w-[285px] rounded-[2.7rem] border-[7px] border-slate-900 bg-slate-950 p-2 shadow-2xl sm:w-[320px]">
              <div className="overflow-hidden rounded-[2.15rem] bg-slate-50">
                <div className="flex items-center justify-between bg-white px-4 py-3">
                  <span className="text-sm font-extrabold text-blue-600">Frianzo</span>
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                </div>
                <div className="space-y-3 p-3">
                  <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm">
                    <div className="h-8 w-8 rounded-full bg-blue-100" />
                    <div className="h-2.5 w-24 rounded-full bg-slate-200" />
                  </div>
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="flex items-center gap-2 p-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100" />
                      <div>
                        <div className="h-2.5 w-20 rounded-full bg-slate-300" />
                        <div className="mt-1.5 h-2 w-12 rounded-full bg-slate-200" />
                      </div>
                    </div>
                    <div className="h-36 bg-gradient-to-br from-blue-100 via-slate-100 to-blue-200" />
                    <div className="flex items-center gap-5 px-3 py-3 text-slate-500">
                      <span>♡</span><span>◌</span><span>↗</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Stories</span>
                      <span className="text-[10px] text-blue-600">View all</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-14 w-14 rounded-full border-2 border-blue-500 bg-blue-100" />
                      <div className="h-14 w-14 rounded-full border-2 border-slate-200 bg-slate-100" />
                      <div className="h-14 w-14 rounded-full border-2 border-slate-200 bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-slate-100 bg-slate-50/80 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Everything in one place</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Made for sharing and connecting</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
                Explore the core social features available across Frianzo.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">About Frianzo</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">A place to share what matters to you</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Frianzo brings social sharing, short-form video, stories, profiles and conversations
            together in one accessible web platform. Visitors can explore what Frianzo offers publicly,
            while members can create an account and start connecting with others.
          </p>
        </section>

        <footer className="border-t border-slate-200 bg-slate-950 px-5 py-10 text-white sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xl font-extrabold">Frianzo</div>
              <p className="mt-1 text-sm text-slate-400">Connect. Share. Discover.</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
              <Link href="/about" className="transition hover:text-white">About</Link>
              <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-white">Terms</Link>
              <a href="mailto:support@frianzo.online" className="transition hover:text-white">Support</a>
            </div>
          </div>
          <div className="mx-auto mt-7 max-w-6xl border-t border-white/10 pt-5 text-xs text-slate-500">
            © {new Date().getFullYear()} Frianzo. All rights reserved.
          </div>
        </footer>
      </div>
    </main>
  );
}
