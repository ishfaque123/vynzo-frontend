export const metadata = { title: 'Refund Policy | Frianzo', description: 'Read the Frianzo Refund Policy covering Blue Tick verification and Boost Post payments, refund eligibility, and how to request a refund.', alternates: { canonical: '/refund-policy' } };

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
      <h1 className="mb-4 text-2xl font-bold">Refund Policy</h1>
      <p className="mb-4 text-sm text-slate-500">Last updated: November 20, 2026</p>

      <p className="mb-4">Frianzo sells two paid services: Blue Tick verification (Rs 400 per month) and Boost Post (paid promotion of a post or reel). Payments are made through PayFast (card, bank transfer, mobile wallet, or Raast) or, for Boost Post, by manual EasyPaisa or JazzCash transfer with a payment screenshot and transaction ID. This policy explains when a payment can be refunded and how to ask for a refund.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Blue Tick (Rs 400 per Month)</h2>
      <p className="mb-4">If you pay for Blue Tick but it is not activated on your account within 7 days of payment, you can ask for a full refund of that payment. Once the Blue Tick has been activated on your account, the fee for that month is non-refundable, because the service has been delivered. If the same payment is charged twice by mistake, the duplicate charge is refunded in full.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Boost Post</h2>
      <p className="mb-4">If your boost request is rejected by our team, or your boost never starts, you can ask for a full refund of that payment. Once a boost has started running, the fee for the days already used is non-refundable. The fee for any remaining unused days can be refunded on request.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">How to Ask for a Refund</h2>
      <p className="mb-4">Email support@frianzo.online with your Frianzo username, the service you paid for (Blue Tick or Boost Post), the payment date and amount, and your transaction ID or payment screenshot. We reply within 3 working days. Approved refunds are sent back through the same payment method you paid with, within 7 working days of approval.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">What We Do Not Refund</h2>
      <p className="mb-4">We do not refund payments for a service that was delivered as described, such as a Blue Tick that stayed active for its paid month or a boost that ran for its full duration. We also cannot refund payments that were sent to a wrong account or wrong number by the user, where no payment proof was given to us.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Contact Us</h2>
      <p className="mb-4">If you have questions about this Refund Policy or a payment you made, please email Ishfaque Ahmed at support@frianzo.online or visit our Contact page. Frianzo, Village Haji Soof Khan, Tharimirwah, District Khairpur, Sindh 66150, Pakistan.</p>
    </div>
  );
}
