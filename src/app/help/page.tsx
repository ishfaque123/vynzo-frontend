export const metadata = {
  title: 'Help Center | Frianzo',
  description: 'Frianzo Help Center — answers about accounts, posts, reels, stories, messaging, privacy, and troubleshooting.',
  alternates: { canonical: '/help' },
};

const SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: 'Getting Started',
    items: [
      {
        q: 'How do I create a Frianzo account?',
        a: 'Go to frianzo.online and choose Sign Up. You can register with your email address or with Google. Pick a unique username, add a profile photo and bio, and you are ready to start sharing.',
      },
      {
        q: 'Is Frianzo free?',
        a: 'Yes. Creating an account and using all core features — posts, reels, stories, messaging — is completely free.',
      },
      {
        q: 'Do I need to install an app?',
        a: 'No. Frianzo runs fully in your mobile or desktop browser. We also offer an Android app that wraps the same experience if you prefer an app icon on your home screen.',
      },
    ],
  },
  {
    title: 'Posts, Reels & Stories',
    items: [
      {
        q: 'How do I publish a post?',
        a: 'Tap the compose button, write your text, optionally attach a photo, and hit Post. Your followers will see it in their home feed.',
      },
      {
        q: 'How do reels work?',
        a: 'Open the Reels tab and tap the + button to upload or record a short vertical video. You can trim the clip, choose a cover frame, and apply a filter before publishing. Reels appear in the reels feed for discovery.',
      },
      {
        q: 'What are stories?',
        a: 'Stories are quick photo or video updates that are easy to discover and do not stay on your profile permanently. Share everyday moments without filling up your feed.',
      },
      {
        q: 'Can I delete or edit my post?',
        a: 'Yes. Open the menu on any of your posts to edit its text or delete it entirely. Deleting a post also removes its comments and reactions.',
      },
    ],
  },
  {
    title: 'Profiles & Following',
    items: [
      {
        q: 'How do I follow someone?',
        a: 'Visit their profile and tap Follow. Their posts will start appearing in your home feed.',
      },
      {
        q: 'What does a private account mean?',
        a: 'On a private profile, posts, reels, and photos are hidden from people who do not follow the account. Follow the account to request access to their content.',
      },
      {
        q: 'How do I change my profile photo or cover?',
        a: 'Open your profile, tap the edit icon on your avatar or cover, and choose a new photo. Changes apply immediately.',
      },
    ],
  },
  {
    title: 'Messaging',
    items: [
      {
        q: 'How do I send a message?',
        a: 'Open the Messages tab, start a new conversation, and type. You can send text, photos, voice notes, and emoji. Swipe right on a message to reply to it directly.',
      },
      {
        q: 'Can I delete a message I sent?',
        a: 'Yes. Long-press the message and choose Delete. You can delete it for everyone or just for yourself, within the allowed time window.',
      },
    ],
  },
  {
    title: 'Privacy & Safety',
    items: [
      {
        q: 'How do I block someone?',
        a: 'Open their profile, tap the menu, and choose Block. They will no longer be able to see your profile, message you, or interact with your posts.',
      },
      {
        q: 'How do I report a post or user?',
        a: 'Use the report option on the post, reel, profile, or message. Our team reviews reports against our Terms of Service and Child Safety policy.',
      },
      {
        q: 'Who can see my posts?',
        a: 'By default your posts are visible to other Frianzo users. If your account is private, only your followers can see your posts, reels, and photos.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings and choose the delete-account option. This permanently removes your profile, posts, and messages. This cannot be undone.',
      },
    ],
  },
  {
    title: 'Referrals, Wallet & Verification',
    items: [
      {
        q: 'How do referrals work?',
        a: 'Every Frianzo account has a personal referral link, available from your profile and dashboard. When a friend signs up through your link and becomes an active user, you earn referral credit. Share the link anywhere — WhatsApp status, other social profiles, or directly with friends.',
      },
      {
        q: 'What is the wallet?',
        a: 'Your wallet is where your referral credit collects inside the app. Open it from your dashboard to see your balance and the withdrawal options available to you, including local payment methods. Amounts and eligibility are always shown in the app before you withdraw.',
      },
      {
        q: 'What is the blue tick and how do I get one?',
        a: 'The blue tick is a verification badge showing that a profile is genuine and established. It is not sold and cannot be requested by brand-new accounts: it is for accounts with a complete profile, real followers, real posts and a clean record. If your account qualifies, you will find the verification option in your settings. Our blog article on the blue tick explains the thinking in detail.',
      },
      {
        q: 'My post was removed or my account was restricted. Why?',
        a: 'Content that breaks the Community Guidelines — including spam, harassment, impersonation and illegal material — can be removed, and repeat violations can restrict an account. If you believe a decision was a mistake, contact us through the Contact page with your username and we will review it.',
      },
    ],
  },
  {
    title: 'Troubleshooting',
    items: [
      {
        q: 'The app feels stuck — what should I do?',
        a: 'First pull down to refresh the feed. If the problem persists, check your internet connection, then close and reopen the app or browser tab. Logging out and back in resolves most session issues.',
      },
      {
        q: 'My upload is not finishing.',
        a: 'Large videos take longer on slow connections. Keep the app open while uploading, and avoid switching networks mid-upload. Photos must be under 10 MB.',
      },
      {
        q: 'I did not receive a login email.',
        a: 'Check your spam or promotions folder. If it still has not arrived after a few minutes, request the email again from the login screen.',
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Help Center</h1>
      <p className="mb-8">
        Quick answers to the most common questions about using Frianzo. Still stuck?{' '}
        <a href="/contact" className="text-blue-600 underline">Contact us</a>.
      </p>

      {SECTIONS.map((section) => (
        <section key={section.title} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">{section.title}</h2>
          <div className="space-y-4">
            {section.items.map((item) => (
              <div key={item.q}>
                <h3 className="font-medium text-slate-900">{item.q}</h3>
                <p className="mt-1 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

    </div>
  );
}
