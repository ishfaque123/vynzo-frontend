const API_URL = process.env.NEXT_PUBLIC_API_URL;

// PayFast (Pakistan) hosted checkout for the paid Blue Tick.
// The price is NEVER sent by the client — the server fixes it
// (Rs 400 for 1 month) and returns a one-time checkout form payload;
// this module just submits that form to PayFast's own page, where
// the customer pays by card, JazzCash, Easypaisa, bank or Raast.
// Error responses keep their `error.code` so the page can map known
// codes to clear user messages (same pattern as boostApi.ts).

async function readJson(res: Response) {
  if (res.status === 204 || res.status === 304) return { success: false, error: { message: `Empty server response (HTTP ${res.status}).` } };
  const text = await res.text();
  if (!text) return { success: false, error: { message: `Request failed (HTTP ${res.status}).` } };
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: { message: `Invalid server response (HTTP ${res.status}).` } };
  }
}

export interface PayFastCheckoutPayload {
  url: string;
  fields: Record<string, string>;
}

export interface PayFastBlueTickPayment {
  id: string;
  basketId: string;
  amountPkr: number;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  createdAt: string;
}

export async function createPayFastBlueTickPayment(): Promise<any> {
  const res = await fetch(`${API_URL}/api/payfast/blue-tick/create`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return readJson(res);
}

// Builds the auto-submit form PayFast's hosted checkout expects and
// sends the browser/WebView to PayFast's payment page. The form
// fields (including the one-time TOKEN) come from the server; the
// secured key is never among them — it never leaves the backend.
export function submitPayFastCheckout(checkout: PayFastCheckoutPayload) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkout.url;
  form.style.display = 'none';
  for (const [name, value] of Object.entries(checkout.fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function payfastErrorMessage(result: any): string {
  const code = result?.error?.code;
  switch (code) {
    case 'PAYFAST_NOT_CONFIGURED':
      return 'Online payment is not available right now. Please use the manual EasyPaisa option below.';
    case 'PAYFAST_COUNTRY_NOT_ELIGIBLE':
      return 'PayFast payment is available for users in Pakistan only. Please use the manual EasyPaisa option below.';
    case 'BLUE_TICK_ALREADY_ACTIVE':
      return 'Your Blue Tick is already active.';
    case 'PAYFAST_CUSTOMER_DETAILS_MISSING':
      return 'Add your email address and mobile number to your profile before paying online.';
    case 'PAYFAST_TOKEN_FAILED':
      return 'Could not start the payment. Please try again in a moment.';
    default:
      return result?.error?.message || 'Something went wrong. Please try again.';
  }
}
