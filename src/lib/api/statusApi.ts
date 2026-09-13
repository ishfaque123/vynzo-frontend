const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchStatusFeed() {
  const res = await fetch(`${API_URL}/api/statuses`, { credentials: 'include' });
  return res.json();
}

export async function createStatus(data: { media?: File | null; textContent?: string; bgColor?: string }) {
  const formData = new FormData();
  if (data.media) formData.append('media', data.media);
  if (data.textContent) formData.append('textContent', data.textContent);
  if (data.bgColor) formData.append('bgColor', data.bgColor);
  const res = await fetch(`${API_URL}/api/statuses`, { method: 'POST', credentials: 'include', body: formData });
  return res.json();
}

export async function viewStatus(statusId: string) {
  const res = await fetch(`${API_URL}/api/statuses/${statusId}/view`, { method: 'POST', credentials: 'include' });
  return res.json();
}

export async function fetchStatusViewers(statusId: string) {
  const res = await fetch(`${API_URL}/api/statuses/${statusId}/viewers`, { credentials: 'include' });
  return res.json();
}

export async function deleteStatus(statusId: string) {
  const res = await fetch(`${API_URL}/api/statuses/${statusId}`, { method: 'DELETE', credentials: 'include' });
  return res.json();
}

export async function toggleStatusLike(statusId: string) {
  const res = await fetch(`${API_URL}/api/statuses/${statusId}/like`, { method: 'POST', credentials: 'include' });
  return res.json();
}
