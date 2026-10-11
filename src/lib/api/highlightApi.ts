const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function readJson(res: Response) {
  try { return await res.json(); } catch { return { success: false }; }
}

export async function fetchHighlights(username: string) {
  const res = await fetch(`${API_URL}/api/highlights/user/${encodeURIComponent(username)}`, { credentials: 'include' });
  return readJson(res);
}

export async function createHighlight(title: string, statusIds: string[]) {
  const res = await fetch(`${API_URL}/api/highlights`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, statusIds }),
  });
  return readJson(res);
}

export async function deleteHighlight(highlightId: string) {
  const res = await fetch(`${API_URL}/api/highlights/${highlightId}`, {
    method: 'DELETE', credentials: 'include',
  });
  return readJson(res);
}
