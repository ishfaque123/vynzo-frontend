const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchConversations() {
  const res = await fetch(`${API_URL}/api/messages/conversations`, { credentials: 'include' });
  return res.json();
}

export async function createConversation(userId: string) {
  const res = await fetch(`${API_URL}/api/messages/conversations`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function fetchMessages(conversationId: string, cursor?: string) {
  const url = new URL(`${API_URL}/api/messages/conversations/${conversationId}/messages`);
  if (cursor) url.searchParams.set('cursor', cursor);
  const res = await fetch(url.toString(), { credentials: 'include' });
  return res.json();
}
