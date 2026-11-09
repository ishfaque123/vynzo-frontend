import Link from 'next/link';

export const metadata = {
  title: 'Child Safety Standards | Frianzo',
  description: 'Frianzo child safety and CSAE prevention standards.',
};

export default function ChildSafetyPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Frianzo
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Child Safety Standards
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Last updated: November 10, 2026</p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Frianzo is for users aged 13 and over. Users under 13 are not allowed on Frianzo.</p>
        </div>

        <div className="space-y-8 text-[15px] leading-7 text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Our commitment to child safety</h2>
            <p>
              Frianzo is committed to maintaining a safe online community. We prohibit child sexual abuse and exploitation (CSAE), including child sexual abuse material (CSAM), and take action when prohibited content or behavior is identified or reported.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Prohibited content and behavior</h2>
            <p>
              Frianzo does not allow content or behavior that sexually exploits, abuses, or endangers children. This includes requesting, creating, sharing, distributing, promoting, or facilitating CSAM or sexual exploitation of minors, as well as attempts to groom or sexually exploit a child.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Reporting child safety concerns</h2>
            <p>
              Users can report child safety concerns through the reporting features available in Frianzo, and can block a user from their profile. Reports may be reviewed by our moderation team and appropriate action may include removing content, restricting accounts, or taking other enforcement action under our rules.
            </p>
            <p className="mt-3">
              In Pakistan, suspected child sexual exploitation or abuse can also be reported to the
              National Cyber Crime Investigation Agency (NCCIA) — the federal cybercrime agency,
              which replaced the FIA Cyber Crime Wing / NR3C — through its online complaint portal{' '}
              <a
                href="https://complaint.nccia.gov.pk"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                complaint.nccia.gov.pk
              </a>{' '}
              or its helpline 1799. (NCMEC is a United States reporting centre and does not take
              reports for Pakistan.)
            </p>
            <p className="mt-3">
              If you believe a child is in immediate danger, contact the appropriate emergency or child-protection authorities in your country. In Pakistan, call 15 in an emergency, or the national child helpline 1121.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Moderation and enforcement</h2>
            <p>
              Frianzo may investigate reports and signals of child-safety violations. We may remove prohibited material, restrict or terminate accounts, preserve relevant information when appropriate, and cooperate with lawful requests from relevant authorities.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Legal compliance and reporting</h2>
            <p>
              Frianzo follows applicable child-safety and online-safety laws and regulations. Where legally required, we report suspected child sexual exploitation or abuse to the relevant authorities or designated reporting channels and cooperate with lawful investigations.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Contact</h2>
            <p>
              For questions about Frianzo&apos;s child-safety practices, CSAE prevention, or compliance, contact our designated child-safety point of contact:
            </p>
            <p className="mt-3">
              <strong>Child Safety Contact: </strong>
              <a
                href="mailto:support@frianzo.online"
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                support@frianzo.online
              </a>
            </p>
            <p className="mt-3">
              Use &quot;Child Safety&quot; in the subject line so your message is prioritised. This
              email is the named contact for all child-safety reports and questions about this page.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
