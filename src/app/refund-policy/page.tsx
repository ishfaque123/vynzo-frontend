export const metadata = { title: 'Refund Policy | Frianzo', description: 'Read the Frianzo Refund Policy covering Blue Tick verification and Boost Post payments, refund eligibility, and how to request a refund.', alternates: { canonical: '/refund-policy' } };

const sections = [
  { id: 'blue-tick', label: 'Blue Tick' },
  { id: 'boost-post', label: 'Boost Post' },
  { id: 'how-to-ask', label: 'How to Ask' },
  { id: 'no-refund', label: 'No Refund Cases' },
];

function SectionCard({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1769D2] text-[13px] font-bold text-white">{number}</span>
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
      </div>
      <div className="text-[15px] leading-[1.7] text-slate-600">{children}</div>
    </section>
  );
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1769D2]">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-extrabold text-[#1769D2]">F</span>
            <span className="text-[15px] font-bold text-white">Frianzo</span>
            <span className="text-[13px] text-blue-200">· Help &amp; Policies</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Refund Policy</h1>
          <p className="mt-1.5 text-[13px] text-blue-100">Last updated: November 20, 2026 · Official Frianzo Policy</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 sm:py-7">
        <p className="mb-5 text-[15px] leading-[1.7] text-slate-600">Frianzo sells two paid services: Blue Tick verification (Rs 400 per month) and Boost Post (paid promotion of a post or reel). Payments are made through PayFast (card, bank transfer, mobile wallet, or Raast) or, for Boost Post, by manual EasyPaisa or JazzCash transfer with a payment screenshot and transaction ID. This policy explains when a payment can be refunded and how to ask for a refund.</p>

        <nav aria-label="On this page" className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2.5 text-xs font-bold tracking-wide text-slate-500">ON THIS PAGE</p>
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[13px] font-medium text-blue-700">
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-3.5">
          <SectionCard id="blue-tick" number="1" title="Blue Tick (Rs 400 per Month)">
            <p>If you pay for Blue Tick but it is not activated on your account within 7 days of payment, you can ask for a full refund of that payment. Once the Blue Tick has been activated on your account, the fee for that month is non-refundable, because the service has been delivered. If the same payment is charged twice by mistake, the duplicate charge is refunded in full.</p>
          </SectionCard>

          <SectionCard id="boost-post" number="2" title="Boost Post">
            <p>If your boost request is rejected by our team, or your boost never starts, you can ask for a full refund of that payment. Once a boost has started running, the fee for the days already used is non-refundable. The fee for any remaining unused days can be refunded on request.</p>
          </SectionCard>

          <SectionCard id="how-to-ask" number="3" title="How to Ask for a Refund">
            <p>Email <a href="mailto:support@frianzo.online" className="font-semibold text-blue-600 underline">support@frianzo.online</a> with your Frianzo username, the service you paid for (Blue Tick or Boost Post), the payment date and amount, and your transaction ID or payment screenshot. We reply within 3 working days. Approved refunds are sent back through the same payment method you paid with, within 7 working days of approval.</p>
          </SectionCard>

          <SectionCard id="no-refund" number="4" title="What We Do Not Refund">
            <p>We do not refund payments for a service that was delivered as described, such as a Blue Tick that stayed active for its paid month or a boost that ran for its full duration. We also cannot refund payments that were sent to a wrong account or wrong number by the user, where no payment proof was given to us.</p>
          </SectionCard>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center sm:p-6">
          <p className="text-[15px] font-bold text-slate-900">Need help with a payment?</p>
          <p className="mt-1">
            <a href="mailto:support@frianzo.online" className="text-[15px] font-semibold text-blue-600 underline">support@frianzo.online</a>
          </p>
          <p className="mt-1.5 text-[13px] text-slate-600">Tap the email to write to us directly.</p>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">Frianzo · Village Haji Soof Khan, Tharimirwah, District Khairpur, Sindh 66150, Pakistan</p>
      </main>
    </div>
  );
}
