const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function readResponse<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) {
    const message = data?.error?.message || data?.message || `Request failed (${res.status}).`;
    return { success: false, error: { message } } as T;
  }
  return data as T;
}

function apiUrl(path: string) {
  if (!API_URL) throw new Error('API is not configured.');
  return `${API_URL}${path}`;
}

export interface IsaiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatWithIsai(messages: IsaiChatMessage[]) {
  try {
    const res = await fetch(apiUrl('/api/ai-assistant/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ messages }),
    });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to connect to the server.' } }; }
}
