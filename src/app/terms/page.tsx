export const metadata = { title: 'Terms of Service | Frianzo', description: 'Read the Frianzo Terms of Service covering account use, content rules, safety, account termination and service changes.', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
      <h1 className="mb-4 text-2xl font-bold">Terms of Service</h1>
      <p className="mb-4 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4">By using Frianzo, you agree to these Terms of Service. Please read them carefully.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Using Our Service</h2>
      <p className="mb-4">You must be at least 13 years old to use Frianzo. You are responsible for the content you post and your conduct on the platform. To create an account you can register with your email address or with Google, pick a unique username, and set up your profile. Everything runs in the browser on phone or desktop, and our Android app wraps the same experience.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">What You Can Do on Frianzo</h2>
      <p className="mb-4">Frianzo brings together posts, photos, short-form video (reels), stories, profiles, comments, reactions, and real-time messaging in one free service. You can share everyday moments, discover creators, follow profiles, join conversations, and message friends privately.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Your Content</h2>
      <p className="mb-4">You keep ownership of the content you post. To run the service, you give Frianzo permission to display and distribute what you publish within Frianzo, according to your visibility settings: content you publish intentionally may be visible to other users, while posts on a private profile are hidden from people who do not follow you. You can edit the text of your posts or delete them entirely; deleting a post also removes its comments and reactions.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Prohibited Content</h2>
      <p className="mb-4">You may not post content that is illegal, harassing, hateful, sexually explicit, or violates the rights of others. Spam, impersonation, and illegal material are also prohibited. We may remove content or suspend accounts that violate these rules.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Safety and Moderation</h2>
      <p className="mb-4">Frianzo provides tools to block and report users or content that violates our guidelines, on every profile and post. Our team reviews reports against these Terms and our Child Safety policy. Content that breaks the Community Guidelines can be removed, and repeat violations can restrict an account. If you believe a decision was a mistake, contact us through the Contact page with your username and we will review it.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Referrals, Wallet and Verification</h2>
      <p className="mb-4">Every Frianzo account has a personal referral link. When a friend signs up through your link and becomes an active user, you earn referral credit, which collects in your in-app wallet. Your wallet shows your balance and the withdrawal options available to you, including local payment methods, and amounts and eligibility are always shown in the app before you withdraw. The blue tick is a verification badge for genuine, established accounts with a complete profile, real followers, real posts and a clean record; it is not available to brand-new accounts.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Account Termination</h2>
      <p className="mb-4">We reserve the right to suspend or terminate accounts that violate these terms or applicable laws.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Account and Data Deletion</h2>
      <p className="mb-4">You can delete your account from Settings. This permanently removes your profile, posts, and messages, and cannot be undone. If you want your personal information reviewed for deletion, you may contact us at support@frianzo.online.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Changes to These Terms</h2>
      <p className="mb-4">We may update these terms from time to time. Continued use of the service means you accept the updated terms.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Contact Us</h2>
      <p className="mb-4">If you have questions about these Terms, please email us at support@frianzo.online or visit our Contact page. We aim to reply within 2 business days.</p>
    </div>
  );
}
