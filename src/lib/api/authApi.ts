const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface SavedAccount {
  id: string;
  username: string | null;
  displayName: string | null;
  profilePictureUrl: string | null;
  profileCompleted: boolean;
}

export async function loginWithGoogleToken(idToken: string) {
  const res = await fetch(`${API_URL}/api/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  return res.json();
}

export async function fetchMe() {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: 'include',
  });
  return res.json();
}

export async function fetchSavedAccounts() {
  const res = await fetch(`${API_URL}/api/auth/accounts`, {
    credentials: 'include',
  });
  return res.json();
}

export async function switchSavedAccount(accountId: string) {
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
