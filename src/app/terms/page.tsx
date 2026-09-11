export const metadata = { title: 'Terms of Service - Friendzo' };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
      <h1 className="mb-4 text-2xl font-bold">Terms of Service</h1>
      <p className="mb-4 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4">By using Friendzo, you agree to these Terms of Service. Please read them carefully.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Using Our Service</h2>
      <p className="mb-4">You must be at least 13 years old to use Friendzo. You are responsible for the content you post and your conduct on the platform.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Prohibited Content</h2>
      <p className="mb-4">You may not post content that is illegal, harassing, hateful, sexually explicit, or violates the rights of others. We may remove content or suspend accounts that violate these rules.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Account Termination</h2>
      <p className="mb-4">We reserve the right to suspend or terminate accounts that violate these terms or applicable laws.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Changes to These Terms</h2>
      <p className="mb-4">We may update these terms from time to time. Continued use of the service means you accept the updated terms.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Contact Us</h2>
      <p className="mb-4">If you have questions about these Terms, please contact us through the app.</p>
    </div>
  );
}
