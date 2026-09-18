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

export async function pingUsage() {
  const res = await fetch(`${API_URL}/api/usage/ping`, { method: 'POST', credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function fetchUsagePings(from: string, to: string) {
  const res = await fetch(
    `${API_URL}/api/usage?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { credentials: 'include', cache: 'no-store' }
  );
  return readJson(res);
}
