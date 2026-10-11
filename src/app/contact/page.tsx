export const metadata = {
  title: 'Contact Us | Frianzo',
  description: 'Contact the Frianzo team — support, feedback, business inquiries, and abuse reports. We aim to reply within 2 business days.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Contact Us</h1>

      <p className="mb-6">
        We would love to hear from you. Whether you need help with your account, want to report
        a problem, or have a business inquiry, reach out through any of the channels below.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Support</h2>
      <p className="mb-4">
        For help with your account, posts, messages, or anything else on Frianzo, email us at{' '}
        <a href="mailto:support@frianzo.online" className="text-blue-600 underline">
          support@frianzo.online
        </a>
        . Please include your username and a description of the issue — screenshots help us
        resolve things faster. We aim to reply within 2 business days.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Report Abuse or Safety Concerns</h2>
      <p className="mb-4">
        If you see content or behavior that violates our{' '}
        <a href="/terms" className="text-blue-600 underline">Terms of Service</a> — including
        harassment, spam, or impersonation — you can report it directly from the post, profile,
        or message using the report option. For urgent safety matters, especially involving
        children, email{' '}
        <a href="mailto:support@frianzo.online" className="text-blue-600 underline">
          support@frianzo.online
        </a>{' '}
        with &quot;Safety&quot; in the subject line and our team will prioritize it. See our{' '}
        <a href="/child-safety" className="text-blue-600 underline">Child Safety</a> page for
        more information.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Privacy Questions</h2>
      <p className="mb-4">
        Questions about how your data is handled? Read our{' '}
        <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a> first — it
        covers what we collect, why, and your choices. For anything not covered there, email{' '}
        <a href="mailto:support@frianzo.online" className="text-blue-600 underline">
          support@frianzo.online
        </a>
        .
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Business &amp; Press</h2>
      <p className="mb-4">
        For partnership, advertising, or press inquiries, email{' '}
        <a href="mailto:support@frianzo.online" className="text-blue-600 underline">
          support@frianzo.online
        </a>{' '}
        with &quot;Business&quot; in the subject line and tell us about your proposal.
      </p>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Before You Write</h2>
      <p className="mb-4">
        Many common questions are answered in our{' '}
        <a href="/help" className="text-blue-600 underline">Help Center</a> — account setup,
        posting, reels, messaging, privacy settings, and troubleshooting. A quick look there
        might save you the wait.
      </p>
    </div>
  );
}
