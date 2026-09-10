const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchUserProfile(username: string) {
  const res = await fetch(`${API_URL}/api/users/${username}`, { credentials: 'include' });
  return res.json();
}

export async function updateProfile(data: { username?: string; displayName?: string; bio?: string }) {
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchFollowCounts(userId: string) {
  const res = await fetch(`${API_URL}/api/follows/${userId}/counts`, { credentials: 'include' });
  return res.json();
}

export async function toggleFollow(userId: string) {
  const res = await fetch(`${API_URL}/api/follows/${userId}`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function fetchFollowStatus(userId: string) {
  const res = await fetch(`${API_URL}/api/follows/${userId}/status`, { credentials: 'include' });
  return res.json();
}

export async function fetchDashboard() {
  const res = await fetch(`${API_URL}/api/users/me/dashboard`, { credentials: 'include' });
  return res.json();
}

export async function blockUser(userId: string) {
  const res = await fetch(`${API_URL}/api/blocks/${userId}`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function unblockUser(userId: string) {
  const res = await fetch(`${API_URL}/api/blocks/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
}

export async function reportUser(userId: string, reason: string, details?: string) {
  const res = await fetch(`${API_URL}/api/users/${userId}/report`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, details }),
  });
  return res.json();
}
