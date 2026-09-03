const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchFeed() {
  const res = await fetch(`${API_URL}/api/posts`, { credentials: 'include' });
  return res.json();
}

export async function createPost(content: string) {
  const res = await fetch(`${API_URL}/api/posts`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res.json();
}
