import { clearOfflineCache } from '@/lib/offline/feedCache';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Permanent fix for broken session after rapid account switching + logout.
 *
 * Root causes:
 * 1. Rapid account switches fire multiple /api/auth/switch requests; they can
 *    complete OUT OF ORDER, so the last-to-complete (not last-initiated) won.
 * 2. In-flight requests (fetchMe, feed, etc.) from the old account could finish
 *    AFTER logout/switch and repopulate stale account data.
 * 3. router.push('/login') is a client-side nav — React state, query caches and
 *    in-memory auth could survive it.
 *
 * Fix:
 * - Every auth-state-changing request carries a sequence number; out-of-order
 *   responses are ignored.
 * - All in-flight fetches are aborted on logout / account switch.
 * - Logout does a hard navigation (window.location.href) for a clean slate.
 */

// --- In-flight request tracking: abort everything on auth change ---
const inflightControllers = new Set<AbortController>();

/**
 * Wrap a fetch so it can be aborted when the auth state changes.
 * Use for any request whose response populates user/account-specific UI.
 */
export function trackableFetch(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs?: number): Promise<Response> {
  const controller = new AbortController();
  inflightControllers.add(controller);
  // Optional timeout: without it a stalled request (e.g. fetchMe on a fresh
  // install with no cached user) leaves the UI stuck forever — the blank
  // screen half of the feed-stall bug. Aborting only rejects this request;
  // callers already handle failures (useAuth falls back to the cached user
  // or null). The timer is cleared on settle.
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
  const promise = fetch(input, { ...init, signal: controller.signal });
  // Always clean up the registry when the request settles.
  promise.finally(() => { inflightControllers.delete(controller); if (timer) clearTimeout(timer); }).catch(() => {});
  return promise;
}

/** Abort every tracked in-flight request. Called on logout / account switch. */
export function abortInflightRequests() {
  for (const controller of inflightControllers) {
    try { controller.abort(); } catch { /* already settled */ }
  }
  inflightControllers.clear();
}

// --- Sequence guard: ignore out-of-order account-switch responses ---
let switchSequence = 0;
/** Returns the sequence number for this switch attempt. */
function nextSwitchSequence(): number {
  switchSequence += 1;
  return switchSequence;
}
/** True if a newer switch has started since `seq` was issued. */
function isStaleSwitch(seq: number): boolean {
  return seq !== switchSequence;
}

/**
 * Broadcast that the session just ended. Every mounted useAuth instance
 * listens for 'frianzo-logout' and resets to logged-out immediately, so a
 * following client-side navigation never renders stale logged-in UI.
 */
function notifyLoggedOut() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('frianzo-logout'));
  }
}

/**
 * Broadcast that the active account just changed. Every mounted useAuth
 * instance listens for 'frianzo-account-switched' and reloads the current
 * user, so a following client-side navigation never renders the previous
 * account's UI.
 */
function notifyAccountSwitched() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('frianzo-account-switched'));
  }
}

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

export async function fetchMe() {
  const res = await trackableFetch(`${API_URL}/api/auth/me`, { credentials: 'include', cache: 'no-store' }, 30000);
  return readJson(res);
}

export async function getSavedAccounts() {
  const res = await fetch(`${API_URL}/api/auth/accounts`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function switchAccountRequest(accountId: string) {
  const seq = nextSwitchSequence();
  // Kill any in-flight requests from the previous account immediately.
  abortInflightRequests();
  const res = await fetch(`${API_URL}/api/auth/switch`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
  const result = await readJson(res);
  // Ignore this response if the user already started another switch after it.
  if (isStaleSwitch(seq)) {
    return { success: false, error: { message: 'Superseded by a newer account switch.' } };
  }
  if (result.success) {
    await clearOfflineCache();
    notifyAccountSwitched();
  }
  return result;
}

export async function logoutRequest() {
  // Stop every in-flight request first: nothing from the old session may
  // complete after logout and resurrect stale account UI.
  abortInflightRequests();
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  const result = await readJson(res);
  if (result.success) {
    await clearOfflineCache();
    notifyLoggedOut();
  }
  return result;
}

export async function deleteAccountRequest() {
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const result = await readJson(res);
  if (result.success) {
    await clearOfflineCache();
    notifyLoggedOut();
  }
  return result;
}

export async function submitProfileSetup(data: {
  username: string; displayName: string; dateOfBirth: string; bio?: string;
}) {
  const res = await fetch(`${API_URL}/api/users/me/profile-setup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return readJson(res);
}

export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(username)}`, {
    credentials: 'include',
  });
  // 404 = not found = available; 200 = taken; other errors = throw
  if (res.status === 404) return true;
  if (res.ok) return false;
  throw new Error('Check failed');
}

export async function savePublicKeyRequest(publicKey: string) {
  const res = await fetch(`${API_URL}/api/auth/public-key`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey }),
  });
  return readJson(res);
}


export async function requestEmailCode(email: string) {
  const res = await fetch(API_URL + '/api/auth/email/request-code', {
    method: 'POST', credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return readJson(res);
}

export async function verifyEmailCode(email: string, code: string) {
  const res = await fetch(API_URL + '/api/auth/email/verify-code', {
    method: 'POST', credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  return readJson(res);
}
