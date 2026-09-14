const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function readResponse<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) {
    const message = data?.error?.message || data?.message || `Request failed (${res.status}).`;
    return { success: false, error: { message, code: data?.error?.code } } as T;
  }
  return data as T;
}

function apiUrl(path: string) {
  if (!API_URL) throw new Error('API is not configured.');
  return `${API_URL}${path}`;
}

export async function fetchReelsConfig() {
  try {
    const res = await fetch(apiUrl('/api/reels/config'), { credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to connect to the server.' } }; }
}

export async function fetchReelFeed(offset = 0) {
  try {
    const res = await fetch(apiUrl(`/api/reels?offset=${Math.max(0, Math.floor(offset))}`), { credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to load reels.' } }; }
}

export async function fetchMyReelStatus() {
  try {
    const res = await fetch(apiUrl('/api/reels/me/status'), { credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to check reel limit.' } }; }
}

export async function fetchFavoriteReels() {
  try {
    const res = await fetch(apiUrl('/api/reels/me/favorites'), { credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to load favorites.' } }; }
}

export async function toggleReelLike(reelId: string) {
  try {
    const res = await fetch(apiUrl(`/api/reels/${encodeURIComponent(reelId)}/like`), { method: 'POST', credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to update like.' } }; }
}

export async function toggleReelFavorite(reelId: string) {
  try {
    const res = await fetch(apiUrl(`/api/reels/${encodeURIComponent(reelId)}/favorite`), { method: 'POST', credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to update favorite.' } }; }
}

export async function deleteReel(reelId: string) {
  try {
    const res = await fetch(apiUrl(`/api/reels/${encodeURIComponent(reelId)}`), { method: 'DELETE', credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to delete reel.' } }; }
}

export function createReelWithProgress(data: { video: File; caption?: string; durationSec?: number }, onProgress: (pct: number) => void): Promise<any> {
  return new Promise((resolve) => {
    if (!API_URL) { resolve({ success: false, error: { message: 'API is not configured.' } }); return; }

    const formData = new FormData();
    formData.append('video', data.video);
    if (data.caption) formData.append('caption', data.caption);
    if (data.durationSec != null) formData.append('durationSec', String(Math.round(data.durationSec)));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/reels`);
    xhr.withCredentials = true;
    xhr.timeout = 120000;
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      let data: any = {};
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : {}; } catch { data = {}; }
      if (xhr.status < 200 || xhr.status >= 300) {
        resolve({ success: false, error: { message: data?.error?.message || `Upload failed (${xhr.status}).`, code: data?.error?.code } });
        return;
      }
      resolve(data);
    };
    xhr.onerror = () => resolve({ success: false, error: { message: 'Network error during upload.' } });
    xhr.ontimeout = () => resolve({ success: false, error: { message: 'Upload timed out. Please try again.' } });
    xhr.onabort = () => resolve({ success: false, error: { message: 'Upload cancelled.' } });
    try { xhr.send(formData); } catch { resolve({ success: false, error: { message: 'Upload failed.' } }); }
  });
}

export async function fetchReelComments(reelId: string) {
  try {
    const res = await fetch(apiUrl(`/api/reels/${encodeURIComponent(reelId)}/comments`), { credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to load comments.' } }; }
}

export async function addReelComment(reelId: string, content: string) {
  try {
    const res = await fetch(apiUrl(`/api/reels/${encodeURIComponent(reelId)}/comments`), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to add comment.' } }; }
}

export async function deleteReelComment(commentId: string) {
  try {
    const res = await fetch(apiUrl(`/api/reels/comments/${encodeURIComponent(commentId)}`), { method: 'DELETE', credentials: 'include' });
    return await readResponse(res);
  } catch { return { success: false, error: { message: 'Unable to delete comment.' } }; }
}
