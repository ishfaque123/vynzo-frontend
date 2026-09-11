const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchNotifications() {
  const res = await fetch(`${API_URL}/api/notifications`, { credentials: 'include' });
  return res.json();
}

export async function fetchUnreadCount() {
  const res = await fetch(`${API_URL}/api/notifications/unread-count`, { credentials: 'include' });
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${API_URL}/api/notifications/read-all`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function deleteNotifications(ids: string[]) {
  const res = await fetch(`${API_URL}/api/notifications`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  return res.json();
}

export async function deleteAllNotifications() {
  const res = await fetch(`${API_URL}/api/notifications/all`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
}
