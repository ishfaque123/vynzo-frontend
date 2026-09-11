export const metadata = { title: 'Privacy Policy - Friendzo' };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
      <h1 className="mb-4 text-2xl font-bold">Privacy Policy</h1>
      <p className="mb-4 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4">Friendzo ("we", "our", "us") operates the frianzo.online website and app. This Privacy Policy explains how we collect, use, and protect your information when you use our service.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Information We Collect</h2>
      <p className="mb-4">When you sign in with Google, we collect your basic profile information (name, profile picture) to create your account. We also store content you create, such as posts, comments, and messages.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">How We Use Information</h2>
      <p className="mb-4">We use your information to operate the platform, show you relevant content, enable communication between users, and improve our service.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Cookies and Advertising</h2>
      <p className="mb-4">We use cookies to keep you signed in. We may display advertisements through Google AdSense, which may use cookies to show relevant ads. You can learn more about how Google uses data at <a className="text-blue-600 underline" href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Data Sharing</h2>
      <p className="mb-4">We do not sell your personal information to third parties. We may share data with service providers who help us operate the platform (e.g. hosting providers).</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Your Rights</h2>
      <p className="mb-4">You can edit or delete your account and content at any time from your account settings.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Contact Us</h2>
      <p className="mb-4">If you have questions about this Privacy Policy, please contact us through the app.</p>
    </div>
  );
}
