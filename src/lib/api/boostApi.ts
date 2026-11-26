const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Boost (web, frianzo-app only): manual-payment post/reel boosts.
// Prices, estimates, purposes and payment details are NEVER hardcoded
// in the UI — they come from GET /api/boosts/config (DESIGN.md §9).
// Amounts are never sent by the client: the server re-derives the
// charged amount from the chosen plan. Error responses keep their
// `error.code` so callers can map the known codes (BOOST_LIMIT_REACHED,
// BOOST_ALREADY_ACTIVE_OR_PENDING, INVALID_BOOST_PURPOSE, ...) to
// clear user messages.

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

export interface BoostPlan {
  days: number;
  amountPkr: number;
  estViewsMin: number;
  estViewsMax: number;
  estClicksMin: number;
  estClicksMax: number;
}

export interface BoostTrial {
  available: boolean;
  planDays: number;
  amountPkr: number;
  dailyBudget?: number;
  days?: number;
}

export interface BoostEstimateFactors {
  reachPerRupeeMin: number;
  reachPerRupeeMax: number;
  impressionsPerRupeeMin: number;
  impressionsPerRupeeMax: number;
  clicksPerReach: number;
}

export interface BoostPurpose {
  id: string;
  label?: string;
  description?: string;
}

export interface BoostPaymentMethod {
  id: string;
  label?: string;
  accountTitle?: string;
  accountNumber?: string;
  instructions?: string;
}

export interface BoostConfig {
  eligible: boolean;
  country?: string | null;
  plans: BoostPlan[];
  firstBoostTrial?: BoostTrial | null;
  // Boost v2 pricing model: daily-budget slider + separate duration.
  budget?: { min: number; max: number; step: number };
  durations?: number[];
  buttonTexts?: string[];
  estimateFactors?: BoostEstimateFactors;
  purposes: BoostPurpose[];
  paymentMethods: BoostPaymentMethod[];
}

export interface BoostResults {
  views: number | null;
  followers: number;
  clicks: number;
}

export interface Boost {
  id: string;
  contentType: 'post' | 'reel';
  postId?: string | null;
  reelId?: string | null;
  userId: string;
  purpose: string;
  planDays: number;
  amountPkr: number;
  dailyBudget?: number | null;
  linkUrl?: string | null;
  buttonText?: string | null;
  linkClicks: number;
  clickCap?: number | null;
  paymentMethod: string;
  transactionId?: string | null;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  adminNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  post?: { id: string; content?: string | null; imageUrl?: string | null; createdAt: string } | null;
  reel?: { id: string; caption?: string | null; thumbnailUrl?: string | null; videoUrl?: string | null; createdAt: string } | null;
  results?: BoostResults | null;
}

export async function fetchBoostConfig(): Promise<any> {
  const res = await fetch(`${API_URL}/api/boosts/config`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function createBoostRequest(body: {
  contentType: 'post' | 'reel';
  postId?: string | null;
  reelId?: string | null;
  purpose: string;
  // Boost v2 sends dailyBudget + days; planDays stays in the type only
  // for older callers — the server derives the amount either way.
  planDays?: number;
  dailyBudget?: number;
  days?: number;
  linkUrl?: string | null;
  buttonText?: string | null;
  // Optional click cap (Clicks only): the boost ends automatically
  // once it reaches this many link clicks. Blank (null) means no
  // cap — the boost runs its full days. Other purposes send null.
  clickCap?: number | null;
  paymentMethod: string;
  transactionId?: string | null;
  screenshotUrl: string;
}): Promise<any> {
  const res = await fetch(`${API_URL}/api/boosts`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return readJson(res);
}

export async function fetchMyBoosts(): Promise<any> {
  const res = await fetch(`${API_URL}/api/boosts/mine`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

// Record one click on a live boost's link button. The Clicks button
// (Shop / Learn More / Order, or the user's own words) fires
// this (fire-and-forget) before opening the link; the server counts
// at most one click per viewer per boost per hour and ends the boost
// automatically when its click cap is reached. A failure here must
// never block the link.
export async function recordBoostClick(boostId: string): Promise<any> {
  try {
    const res = await fetch(`${API_URL}/api/boosts/${encodeURIComponent(boostId)}/click`, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });
    return readJson(res);
  } catch {
    return { success: false, error: { message: 'Click could not be recorded.' } };
  }
}

// Content previews for the Boost page (DESIGN.md §9.2): the same reads
// the rest of the site already uses.
export async function fetchBoostPostPreview(postId: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/posts/${encodeURIComponent(postId)}`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function fetchBoostReelPreview(reelId: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/reels/${encodeURIComponent(reelId)}`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

/** PK gate for every Boost UI element (owner rule, DESIGN.md §9.1):
 *  the signed-in user's own country from GET /api/users/me, normalized
 *  the same way the backend does (normalizeCountry) — stored values are
 *  a 2-letter code ("PK") or a legacy full name ("Pakistan"). */
export function isBoostCountryPk(raw: string | null | undefined): boolean {
  const t = (raw || '').trim();
  return t.toUpperCase() === 'PK' || t.toLowerCase() === 'pakistan';
}

export function boostPurposeLabel(id: string | null | undefined): string {
  switch (id) {
    case 'followers_gain':
      return 'Followers Gain';
    case 'views_gain':
      return 'Views Gain';
    case 'clicks':
      return 'Clicks';
    case 'business_promotion':
      // Legacy rows only — Business Promotion can no longer be created
      // (owner decision 2026-11-25), but old boosts keep their label.
      return 'Business Promotion';
    default:
      return 'Boost';
  }
}

export function boostErrorMessage(result: any): string {
  const code = result?.error?.code;
  switch (code) {
    case 'BOOST_LIMIT_REACHED':
      return 'You already have 3 boosts running. Wait for one to finish before starting another.';
    case 'BOOST_ALREADY_ACTIVE_OR_PENDING':
      return 'This post already has a boost request pending or running.';
    case 'INVALID_BOOST_PURPOSE':
      return 'Please choose a purpose for this boost.';
    case 'INVALID_BOOST_BUDGET':
      return 'Choose a daily budget between Rs 100 and Rs 1,000.';
    case 'INVALID_BOOST_DURATION':
      return 'Choose how many days the boost should run.';
    case 'INVALID_BOOST_LINK':
      return 'Enter a valid link starting with http:// or https://.';
    case 'INVALID_BOOST_BUTTON':
      return 'Choose a button text for your link (up to 30 letters).';
    case 'INVALID_BOOST_CLICK_CAP':
      return 'Choose how many clicks the boost should stop after (1 to 100,000).';
    case 'BOOST_COUNTRY_NOT_ELIGIBLE':
      return 'Boost is available for users in Pakistan only.';
    case 'FORBIDDEN':
      return 'You can only boost your own posts and reels.';
    case 'POST_NOT_PUBLIC':
      return 'Only public posts can be boosted.';
    case 'REPOST_NOT_BOOSTABLE':
      return 'Reposts cannot be boosted — boost the original post instead.';
    default:
      return result?.error?.message || 'Something went wrong. Please try again.';
  }
}
