const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
  return res.json();
}

export async function logoutRequest() {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
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
