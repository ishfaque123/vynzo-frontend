const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function readJson(res: Response) {
  if (res.status === 204 || res.status === 304) return { success: true, data: {} };
  const text = await res.text();
  if (!text) return { success: false, error: { message: `Request failed (HTTP ${res.status}).` } };
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: { message: `Invalid server response (HTTP ${res.status}).` } };
  }
}

export async function fetchNotifications() {
  const res = await fetch(`${API_URL}/api/notifications`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function fetchUnreadCount() {
  const res = await fetch(`${API_URL}/api/notifications/unread-count`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${API_URL}/api/notifications/read-all`, {
    method: 'POST',
    credentials: 'include',
  });
  return readJson(res);
}

export async function deleteNotifications(ids: string[]) {
  const res = await fetch(`${API_URL}/api/notifications`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  return readJson(res);
}

export async function deleteAllNotifications() {
  const res = await fetch(`${API_URL}/api/notifications/all`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return readJson(res);
}
