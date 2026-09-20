import { clearOfflineCache } from '@/lib/offline/feedCache';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function getSavedAccounts() {
  const res = await fetch(`${API_URL}/api/auth/accounts`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function switchAccountRequest(accountId: string) {
  const res = await fetch(`${API_URL}/api/auth/switch`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
  const result = await readJson(res);
  if (result.success) await clearOfflineCache();
  return result;
}

export async function logoutRequest() {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  const result = await readJson(res);
  if (result.success) await clearOfflineCache();
  return result;
}

export async function deleteAccountRequest() {
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const result = await readJson(res);
  if (result.success) await clearOfflineCache();
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
