const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createShareLink(type: 'profile' | 'post' | 'reel', id: string) {
  const res = await fetch(`${API_URL}/api/share`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, id }),
  });
  return res.json();
}

export async function recordShare(type: 'post' | 'reel', id: string, channel: string) {
  // Fire-and-forget by design: a failed count must never block a share.
  try {
    await fetch(`${API_URL}/api/share/event`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, channel }),
    });
  } catch {
    // Count only; share already happened.
  }
}

export async function resolveShareLink(code: string) {
  const res = await fetch(`${API_URL}/api/share/${code}`, { credentials: 'include' });
  return res.json();
}
