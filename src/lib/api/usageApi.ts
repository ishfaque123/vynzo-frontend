const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function pingUsage() {
  const res = await fetch(`${API_URL}/api/usage/ping`, { method: 'POST', credentials: 'include' });
  return res.json();
}

export async function fetchUsagePings(from: string, to: string) {
  const res = await fetch(
    `${API_URL}/api/usage?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { credentials: 'include' }
  );
  return res.json();
}
