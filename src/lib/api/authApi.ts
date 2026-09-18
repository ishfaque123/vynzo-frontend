const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchMe() {
  const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
  return res.json();
}

export async function getSavedAccounts() {
  const res = await fetch(`${API_URL}/api/auth/accounts`, { credentials: 'include' });
  return res.json();
}

export async function switchAccountRequest(accountId: string) {
  const res = await fetch(`${API_URL}/api/auth/switch`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
  return res.json();
}

export async function logoutRequest() {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function deleteAccountRequest() {
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
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
  return res.json();
}

export async function savePublicKeyRequest(publicKey: string) {
  const res = await fetch(`${API_URL}/api/auth/public-key`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey }),
  });
  return res.json();
}


export async function requestEmailCode(email: string) {
  const res = await fetch(API_URL + '/api/auth/email/request-code', {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function verifyEmailCode(email: string, code: string) {
  const res = await fetch(API_URL + '/api/auth/email/verify-code', {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  return res.json();
}
