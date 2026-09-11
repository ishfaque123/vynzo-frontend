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
