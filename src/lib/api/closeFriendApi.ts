const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchCloseFriendCandidates() {
  const res = await fetch(`${API_URL}/api/close-friends`, { credentials: 'include' });
  return res.json();
}

export async function addCloseFriend(userId: string) {
  const res = await fetch(`${API_URL}/api/close-friends/${userId}`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function removeCloseFriend(userId: string) {
  const res = await fetch(`${API_URL}/api/close-friends/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
}
