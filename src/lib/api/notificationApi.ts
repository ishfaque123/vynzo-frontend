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

export async function fetchNotifications(params?: { offset?: number; limit?: number }) {
  // With no params the request URL is exactly the historical one; the server
  // then returns the first page (newest 50) plus a hasMore flag.
  const query = new URLSearchParams();
  if (params?.offset !== undefined) query.set('offset', String(params.offset));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await fetch(`${API_URL}/api/notifications${qs ? `?${qs}` : ''}`, { credentials: 'include', cache: 'no-store' });
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

export async function markNotificationRead(id: string) {
  const res = await fetch(`${API_URL}/api/notifications/${encodeURIComponent(id)}/read`, {
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

export async function registerPushToken(token: string) {
  const res = await fetch(`${API_URL}/api/notifications/push-token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return readJson(res);
}

export async function removePushToken(token: string) {
  const res = await fetch(`${API_URL}/api/notifications/push-token`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return readJson(res);
}

export async function fetchNotificationPreferences() {
  const res = await fetch(`${API_URL}/api/notifications/preferences`, {
    credentials: 'include',
  });
  return readJson(res);
}

export async function setNotificationPreference(category: string, enabled: boolean) {
  const res = await fetch(`${API_URL}/api/notifications/preferences`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, enabled }),
  });
  return readJson(res);
}
