export const metadata = { title: 'Privacy Policy | Frianzo', description: 'Read the Frianzo Privacy Policy to learn how account information, user content, technical data, advertising and privacy requests are handled.', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-700">
      <h1 className="mb-3 text-3xl font-bold text-slate-900">Privacy Policy for Frianzo</h1>
      <p className="mb-8 text-sm text-slate-500">Last Updated: September 26, 2026</p>

      <p className="mb-5">
        Welcome to Frianzo ("Frianzo", "we", "us", or "our"). Frianzo is a social networking
        service that allows users to create profiles, share photos, videos and text, follow
        accounts, interact with posts, communicate with other users, and use related social
        features.
      </p>
      <p className="mb-5">
        This Privacy Policy explains what information we collect, how we use it, when we share it,
        how long we may retain it, and the choices and rights available to users.
      </p>

      <Section title="1. Information We Collect">
        <p>
          Depending on how you use Frianzo, we may process account information, user content, and
          technical information needed to provide and secure the service.
        </p>
      </Section>

      <Section title="1.1 Account and Profile Information">
        <p>We may collect information such as:</p>
        <List items={[
          "Name",
          "Username",
          "Email address",
          "Profile photo",
          "Biography and other profile information",
          "Account identifiers",
          "Authentication information",
          "Information you provide when contacting support",
        ]} />
        <p>
          If you sign in with Google, Google may provide basic account information such as your
          name, email address, and profile picture as permitted by the sign-in flow.
        </p>
      </Section>

      <Section title="1.2 User Content and Activity">
        <p>When you use Frianzo, we may process content and activity you choose to provide, including:</p>
        <List items={[
          "Photos and videos",
          "Text posts",
          "Comments and replies",
          "Profile images and profile information",
          "Messages and other communications",
          "Likes, follows, reactions and other interactions",
        ]} />
        <p>
          Content you intentionally publish may be visible to other users according to the
          features and visibility settings of Frianzo.
        </p>
      </Section>

      <Section title="1.3 Device and Technical Information">
        <p>We and our service providers may process technical information such as:</p>
        <List items={[
          "Device and browser information",
          "IP address",
          "Operating system and version",
          "App or website version",
          "Network and connectivity information",
          "Crash and diagnostic information where applicable",
          "Security and fraud-prevention information",
        ]} />
        <p>
          We use this information to operate, secure, troubleshoot, maintain, and improve Frianzo.
        </p>
      </Section>

      <Section title="2. How We Use Information">
        <p>We may use information to:</p>
        <List items={[
          "Create and maintain accounts",
          "Authenticate users",
          "Provide social networking and communication features",
          "Display profiles and user content",
          "Process photo, video and text uploads",
          "Provide notifications and service communications",
          "Provide customer support",
          "Prevent fraud, abuse and unauthorized activity",
          "Protect the security of Frianzo",
          "Detect and fix technical problems",
          "Measure and improve service performance",
          "Provide and measure advertising",
          "Comply with applicable legal obligations",
        ]} />
      </Section>

      <Section title="3. How We Share Information">
        <p>
          We may share information when necessary to operate Frianzo with service providers that
          support areas such as hosting, infrastructure, authentication, security, storage,
          communications, analytics, and advertising.
        </p>
        <p className="mt-3">
          Information you intentionally make public, such as public profile information, posts,
          comments, or other public interactions, may be visible to other Frianzo users.
        </p>
        <p className="mt-3">
          We may also disclose information when reasonably necessary to comply with applicable law,
          respond to lawful requests, investigate abuse or fraud, protect users, or protect the
          rights and security of Frianzo.
        </p>
      </Section>

      <Section title="4. Sale of Personal Information">
        <p>
          Frianzo does not sell personal information for monetary consideration. Some privacy laws
          use broader definitions of "sale" or "sharing"; where such laws apply, users may have
          additional rights regarding advertising or other processing.
        </p>
      </Section>

      <Section title="5. Advertising, Cookies and Google Services">
        <p>
          Frianzo may use cookies and similar technologies for functions such as maintaining
          sessions, security, preferences, and measuring website performance.
        </p>
        <p className="mt-3">
          Frianzo may display advertisements through Google advertising services, including Google
          AdSense on the website. Google and its advertising partners may process information such
          as IP address, cookies, device information, and advertising-related identifiers to
          provide, measure, and protect advertising services, subject to applicable settings,
          consent requirements, and Google's policies.
        </p>
        <p className="mt-3">
          Where applicable, users may manage advertising or consent choices through the controls
          provided by Google and through applicable Frianzo privacy controls.
        </p>
        <p className="mt-3">
          More information is available in Google's privacy documentation and advertising
          settings.
        </p>
      </Section>

      <Section title="6. Data Retention">
        <p>
          We retain information for as long as reasonably necessary to provide Frianzo, maintain
          accounts and security, provide requested features, prevent abuse, resolve disputes,
          enforce our agreements, maintain limited backups, and meet legal obligations.
        </p>
        <p className="mt-3">
          When information is no longer required, we may delete, anonymize, or otherwise securely
          dispose of it, subject to applicable law and legitimate operational requirements.
        </p>
      </Section>

      <Section title="7. Account and Data Deletion">
        <p>
          Frianzo provides account and data-management options through the service where available.
          If you want your account or personal information reviewed for deletion, you may contact
          us at <a className="text-blue-600 underline" href="mailto:support@frianzo.online">support@frianzo.online</a>.
        </p>
        <p className="mt-3">
          Some information may need to be retained where required for legal compliance, security,
          fraud prevention, dispute resolution, enforcement of our terms, or limited backups.
        </p>
      </Section>

      <Section title="8. Your Privacy Rights">
        <p>
          Depending on your location and applicable law, you may have rights to access, correct,
          delete, restrict, object to, or request portability of certain personal information.
          You may also have rights concerning targeted advertising or other processing.
        </p>
        <p className="mt-3">
          Privacy requests can be submitted to <a className="text-blue-600 underline" href="mailto:support@frianzo.online">support@frianzo.online</a>.
          We may need to verify your identity before processing a request.
        </p>
      </Section>

      <Section title="9. European Economic Area, United Kingdom and Switzerland">
        <p>
          Where applicable data-protection law such as the GDPR applies, users may have rights
          including access, rectification, erasure, restriction, data portability, objection, and
          withdrawal of consent where processing is based on consent. Users may also have the right
          to complain to a relevant data-protection authority.
        </p>
        <p className="mt-3">
          Depending on the processing activity, information may be processed on the basis of
          contract performance, legitimate interests, consent where required, or legal obligations.
        </p>
      </Section>

      <Section title="10. California Privacy Rights">
        <p>
          If applicable California privacy law applies to you, you may have rights such as access,
          deletion, correction, and rights concerning sale or sharing and targeted advertising.
          Requests may be submitted to <a className="text-blue-600 underline" href="mailto:support@frianzo.online">support@frianzo.online</a>.
        </p>
      </Section>

      <Section title="11. Children's Privacy">
        <p>
          Frianzo is not intended for children below the minimum age permitted under applicable law.
          We do not knowingly collect personal information from children where prohibited by law.
          If you believe a child has provided personal information in violation of applicable
          requirements, contact us at <a className="text-blue-600 underline" href="mailto:support@frianzo.online">support@frianzo.online</a>.
        </p>
      </Section>

      <Section title="12. Data Security">
        <p>
          We use reasonable technical and organizational measures designed to protect personal
          information against unauthorized access, alteration, disclosure, or destruction. These
          measures may include access controls, authentication controls, encryption in transit,
          monitoring, security protections, and backup and recovery controls.
        </p>
        <p className="mt-3">No internet service can guarantee absolute security.</p>
      </Section>

      <Section title="13. International Data Processing">
        <p>
          Frianzo and its service providers may process information in countries other than the
          country where you live. Where required by applicable law, appropriate safeguards are used
          for international transfers.
        </p>
      </Section>

      <Section title="14. Third-Party Services">
        <p>
          Frianzo may use third-party services for authentication, hosting, infrastructure,
          storage, security, analytics, communications, and advertising. These providers may
          process information according to their own privacy policies and terms.
        </p>
        <p className="mt-3">
          Applicable Google services may include Google Sign-In and Google advertising services.
          Users should review the privacy policies of third-party services that apply to their use
          of Frianzo.
        </p>
      </Section>

      <Section title="15. Data Controller and Privacy Contact">
        <p>
          Frianzo is the service described by this Privacy Policy. For privacy questions, access,
          correction, deletion, or other privacy requests, contact:
        </p>
        <p className="mt-3">
          <strong>Email:</strong>{" "}
          <a className="text-blue-600 underline" href="mailto:support@frianzo.online">
            support@frianzo.online
          </a>
        </p>
        <p className="mt-2">
          <strong>Website:</strong>{" "}
          <a className="text-blue-600 underline" href="https://www.frianzo.online">
            www.frianzo.online
          </a>
        </p>
      </Section>

      <Section title="16. How to Submit a Privacy Request">
        <p>Please email <a className="text-blue-600 underline" href="mailto:support@frianzo.online">support@frianzo.online</a> and include:</p>
        <List items={[
          "Your Frianzo username, if applicable",
          "The email address associated with your account, if applicable",
          "The type of privacy request",
          "Any information reasonably necessary to identify the relevant account or data",
        ]} />
        <p>
          We may request additional information to verify your identity and protect your account.
          We will respond within the period required by applicable law.
        </p>
      </Section>

      <Section title="17. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy when our services, technologies, legal requirements,
          or data-processing practices change. Material changes may be communicated through the
          service or other appropriate means. The "Last Updated" date at the beginning of this page
          shows when the policy was most recently revised.
        </p>
      </Section>

      <Section title="18. Contact Us">
        <p>
          For privacy questions, requests, or concerns:
        </p>
        <p className="mt-3">
          <strong>Email:</strong>{" "}
          <a className="text-blue-600 underline" href="mailto:support@frianzo.online">support@frianzo.online</a>
        </p>
        <p className="mt-2">
          <strong>Website:</strong>{" "}
          <a className="text-blue-600 underline" href="https://www.frianzo.online">www.frianzo.online</a>
        </p>
      </Section>

      <p className="mt-10 border-t pt-5 text-sm text-slate-500">
        © 2026 Frianzo. All rights reserved.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-6">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}
