export const metadata = {
  title: 'Community Guidelines | Frianzo',
  description: 'Frianzo community guidelines — what is allowed, what gets removed, and how moderation works on posts, comments and reels.',
  alternates: { canonical: '/community-guidelines' },
};

function Tier({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-slate-200 p-5">
      <h2 className={`mb-3 text-lg font-semibold ${color}`}>{title}</h2>
      <div className="space-y-2 text-slate-700">{children}</div>
    </div>
  );
}

export default function CommunityGuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Community Guidelines</h1>

      <p className="mb-8">
        Frianzo is a place for real connection. To keep it respectful for everyone, we
        moderate posts, comments and reels automatically. Here is exactly how it works —
        no surprises.
      </p>

      <Tier color="text-green-700" title="Allowed — nothing happens">
        <p>Healthy disagreement, criticism, sarcasm and debate are welcome. Mild words like
        “idiot”, “stupid” or “dumb” in a normal conversation are <strong>not</strong> violations —
        we do not punish everyday language.</p>
      </Tier>

      <Tier color="text-amber-700" title="Removed — you get notified with the reason">
        <p>The following will be removed, and you will receive a notification explaining why:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Profanity &amp; slurs</strong> — swear words and abusive language (gaali galoch)</li>
          <li><strong>Hate speech</strong> — attacks based on race, religion, gender, ethnicity or similar</li>
          <li><strong>Sexual / explicit language</strong> — in posts, comments or captions</li>
          <li><strong>Harassment &amp; bullying</strong> — targeting or intimidating another person</li>
          <li><strong>Spam &amp; scams</strong> — promotional links, fake giveaways, “earn money” schemes</li>
        </ul>
      </Tier>

      <Tier color="text-red-700" title="Removed + account action — zero tolerance">
        <p>The following can lead to immediate removal and restriction of your account:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Threats of violence</strong> — against any person or group</li>
          <li><strong>Child safety violations</strong> — any sexual content involving minors</li>
          <li><strong>Terrorism &amp; extremism</strong> — praise or promotion of violent extremism</li>
        </ul>
      </Tier>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">How moderation works</h2>
      <ul className="mb-4 list-disc pl-5 space-y-2">
        <li>Your post or comment goes live <strong>immediately</strong> — nothing is blocked upfront.</li>
        <li>Within seconds, an automated system reviews it against these guidelines.</li>
        <li>If it violates the rules, it is removed and you are notified with the specific reason.</li>
        <li>If you believe a removal was a mistake, contact us and a human will review it.</li>
      </ul>

      <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Report content</h2>
      <p className="mb-4">
        See something that breaks these rules? Use the report option on any post or comment.
        Reports are reviewed and help keep Frianzo safe for everyone.
      </p>

      <p className="mt-8 text-sm text-slate-500">
        These guidelines apply to posts, comments, reels, stories and messages. We may update
        them as the community grows.
      </p>
    </div>
  );
}
