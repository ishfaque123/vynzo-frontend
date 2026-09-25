const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchUserProfile(username: string) {
  const res = await fetch(`${API_URL}/api/users/${username}`, { credentials: 'include' });
  return res.json();
}

export async function updateProfile(data: {
  username?: string;
  displayName?: string;
  bio?: string;
  messagePermission?: 'everyone' | 'followers' | 'none';
  tagPermission?: 'everyone' | 'followers' | 'none';
  showOnlineStatus?: boolean;
  isPrivate?: boolean;
  publicKey?: string;
}) {
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

export async function fetchBlockStatus(userId: string) {
  const res = await fetch(`${API_URL}/api/blocks/${userId}/status`, { credentials: 'include' });
  return res.json();
}

export async function fetchBlockedUsers() {
  const res = await fetch(`${API_URL}/api/blocks`, { credentials: 'include' });
  return res.json();
}

export async function hideBlockedEntries(ids: string[]) {
  const res = await fetch(`${API_URL}/api/blocks/hide`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
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

export async function updateAvatar(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_URL}/api/users/me/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return res.json();
}

export async function updateCover(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_URL}/api/users/me/cover`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return res.json();
}


export async function fetchMyVerificationRequest() {
  const res = await fetch(`${API_URL}/api/users/me/verification-request`, { credentials: 'include' });
  return res.json();
}

export async function createVerificationRequest(reason: string) {
  const res = await fetch(`${API_URL}/api/users/me/verification-request`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}
