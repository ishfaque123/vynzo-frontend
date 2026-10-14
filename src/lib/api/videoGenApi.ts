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

export async function fetchVideoGenStatus() {
  try {
    const res = await fetch(apiUrl('/api/video-gen/status'), { credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to connect to the server.' } }; }
}

export async function startVideoGeneration(prompt: string, aspectRatio: '16:9' | '9:16', durationSeconds: 4 | 8) {
  try {
    const res = await fetch(apiUrl('/api/video-gen/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ prompt, aspectRatio, durationSeconds }),
    });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to connect to the server.' } }; }
}

export async function checkVideoOperation(operationName: string) {
  try {
    const res = await fetch(apiUrl(`/api/video-gen/operation/${encodeURIComponent(operationName)}`), { credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to connect to the server.' } }; }
}
