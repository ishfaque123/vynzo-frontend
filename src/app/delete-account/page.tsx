export const metadata = {
  title: 'Delete Your Account | Frianzo',
  description: 'How to delete your Frianzo account and data',
};

export default function DeleteAccountInfoPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-bold">Delete Your Account</h1>
      <p className="mb-4 text-slate-600">
        You can delete your Frianzo account and all associated data at any time.
      </p>
      <h2 className="mb-2 text-lg font-semibold">From the app:</h2>
      <ol className="mb-6 list-decimal pl-6 text-slate-600">
        <li>Open Settings</li>
        <li>Go to Login &amp; Security</li>
        <li>Tap Delete Account</li>
        <li>Type DELETE to confirm</li>
      </ol>
      <p className="mb-4 text-slate-600">
        This will permanently delete your profile, posts, comments, reels, messages, and followers. This action cannot be undone.
      </p>
      <h2 className="mb-2 text-lg font-semibold">By email:</h2>
      <p className="text-slate-600">
        You can also request account deletion by emailing{' '}
        <a href="mailto:support@frianzo.online" className="text-blue-600 underline">
          support@frianzo.online
        </a>{' '}
        from your registered email address.
      </p>
    </div>
  );
}
