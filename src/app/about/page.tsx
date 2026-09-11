export const metadata = { title: 'About - Friendzo' };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
      <h1 className="mb-4 text-2xl font-bold">About Friendzo</h1>

      <p className="mb-4">Friendzo is a social platform where people connect, share moments, and stay in touch with friends. Users can post updates and photos, follow people they're interested in, react and comment on posts, and message each other in real time.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">What You Can Do</h2>
      <ul className="mb-4 list-disc pl-5 space-y-1">
        <li>Share posts, photos, and updates with your network</li>
        <li>Follow other users and see their posts in your feed</li>
        <li>Comment and react to posts</li>
        <li>Send private messages in real time</li>
        <li>Build and manage your public profile</li>
      </ul>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Safety First</h2>
      <p className="mb-4">We provide tools to block and report users or content that violates our guidelines, so our community stays safe and respectful. See our <a href="/terms" className="text-blue-600 underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a> for more details.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Contact</h2>
      <p className="mb-4">Have questions or feedback? Reach out to us through the app.</p>
    </div>
  );
}
