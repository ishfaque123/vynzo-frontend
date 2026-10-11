export const metadata = {
  title: 'About Frianzo | Social Network',
  description: 'Learn about Frianzo — a social network for sharing posts, photos, stories and reels, discovering people, and connecting with friends. Our mission, features, and community values.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">About Frianzo</h1>

      <p className="mb-4">
        Frianzo is a social platform built for real connection. We bring together posts, photos,
        short-form video (reels), stories, profiles, comments, reactions, and real-time messaging
        in one fast, accessible web platform — no app install required. Whether you want to share
        everyday moments, discover creators, or stay in touch with friends and family, Frianzo
        gives you the tools to do it your way.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Our Mission</h2>
      <p className="mb-4">
        Social media should feel personal, not noisy. Our mission is to give everyone a simple,
        respectful space to share what matters — with the people who matter. We focus on genuine
        interaction over vanity metrics: meaningful posts, real conversations, and communities
        built on trust.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">What You Can Do on Frianzo</h2>
      <ul className="mb-4 list-disc pl-5 space-y-2">
        <li>
          <strong>Share posts &amp; photos</strong> — publish text updates and photos with your
          followers, and react and comment on what others share.
        </li>
        <li>
          <strong>Create reels</strong> — shoot or upload short vertical videos, trim them, pick a
          cover frame, apply filters, and publish to the reels feed.
        </li>
        <li>
          <strong>Post stories</strong> — share quick updates and moments that stay fresh and easy
          to discover.
        </li>
        <li>
          <strong>Build your profile</strong> — add a photo, cover image, and bio so people can
          discover who you are.
        </li>
        <li>
          <strong>Follow &amp; connect</strong> — follow accounts you care about and see their
          updates in your home feed.
        </li>
        <li>
          <strong>Message in real time</strong> — send private one-to-one messages with text,
          photos, voice notes, and emoji.
        </li>
        <li>
          <strong>Stay safe</strong> — block, report, and manage your privacy with built-in
          controls on every profile and post.
        </li>
      </ul>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">How Frianzo Works</h2>
      <p className="mb-4">
        Getting started takes less than a minute. Create a free account with your email or Google,
        set up your profile, and start sharing. Your home feed shows posts from people you follow,
        the reels tab surfaces short videos to discover, and your inbox keeps conversations
        organized. Everything runs in the browser on phone or desktop, and our Android app wraps
        the same experience natively for an app-like feel.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Community &amp; Safety</h2>
      <p className="mb-4">
        A healthy community needs clear rules and real enforcement. Frianzo provides tools to
        block and report users or content that violates our guidelines, and our team reviews
        reports to keep the platform safe and respectful. We also publish a dedicated{' '}
        <a href="/child-safety" className="text-blue-600 underline">Child Safety</a> policy. See
        our <a href="/terms" className="text-blue-600 underline">Terms of Service</a> and{' '}
        <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a> for the full
        details on how the platform and your data are handled.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Contact Us</h2>
      <p className="mb-4">
        Have questions, feedback, or a business inquiry? Email us at{' '}
        <a href="mailto:support@frianzo.online" className="text-blue-600 underline">
          support@frianzo.online
        </a>{' '}
        — we read every message and aim to reply within 2 business days. You can also visit our{' '}
        <a href="/contact" className="text-blue-600 underline">Contact page</a> or browse the{' '}
        <a href="/help" className="text-blue-600 underline">Help Center</a> for quick answers.
      </p>
    </div>
  );
}
