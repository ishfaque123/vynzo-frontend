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

export async function fetchStatusFeed() {
  const res = await fetch(`${API_URL}/api/statuses`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function createStatus(data: { media?: File | null; textContent?: string; bgColor?: string; visibility?: string; stickers?: any[] }) {
  const formData = new FormData();
  if (data.media) formData.append('media', data.media);
  if (data.textContent) formData.append('textContent', data.textContent);
  if (data.bgColor) formData.append('bgColor', data.bgColor);
  if (data.visibility) formData.append('visibility', data.visibility);
  if (data.stickers?.length) formData.append('stickers', JSON.stringify(data.stickers));
  const res = await fetch(`${API_URL}/api/statuses`, { method: 'POST', credentials: 'include', body: formData });
  return readJson(res);
}

export async function viewStatus(statusId: string) {
  const res = await fetch(`${API_URL}/api/statuses/${statusId}/view`, { method: 'POST', credentials: 'include' });
  return readJson(res);
}

export async function fetchStatusViewers(statusId: string) {
  const res = await fetch(`${API_URL}/api/statuses/${statusId}/viewers`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function deleteStatus(statusId: string) {
  const res = await fetch(`${API_URL}/api/statuses/${statusId}`, { method: 'DELETE', credentials: 'include' });
  return readJson(res);
}

export async function toggleStatusLike(statusId: string) {
  const res = await fetch(`${API_URL}/api/statuses/${statusId}/like`, { method: 'POST', credentials: 'include' });
  return readJson(res);
}

export async function votePoll(stickerId: string, optionIndex: number) {
  const res = await fetch(`${API_URL}/api/statuses/stickers/${stickerId}/vote`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionIndex }),
  });
  return readJson(res);
}

export async function answerQuestion(stickerId: string, text: string) {
  const res = await fetch(`${API_URL}/api/statuses/stickers/${stickerId}/answer`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return readJson(res);
}

export async function muteStories(userId: string) {
  const res = await fetch(`${API_URL}/api/statuses/mute/${userId}`, { method: 'POST', credentials: 'include' });
  return readJson(res);
}

export async function unmuteStories(userId: string) {
  const res = await fetch(`${API_URL}/api/statuses/mute/${userId}`, { method: 'DELETE', credentials: 'include' });
  return readJson(res);
}

export async function getMutedStories() {
  const res = await fetch(`${API_URL}/api/statuses/muted`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function getCloseFriends() {
  const res = await fetch(`${API_URL}/api/close-friends`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function addCloseFriend(userId: string) {
  const res = await fetch(`${API_URL}/api/close-friends/${userId}`, { method: 'POST', credentials: 'include' });
  return readJson(res);
}

export async function removeCloseFriend(userId: string) {
  const res = await fetch(`${API_URL}/api/close-friends/${userId}`, { method: 'DELETE', credentials: 'include' });
  return readJson(res);
}

// Uses XMLHttpRequest instead of fetch so we can report upload progress
// (fetch has no reliable cross-browser upload-progress event).
export function createStatusWithProgress(
  data: { media?: File | null; textContent?: string; bgColor?: string; visibility?: string; stickers?: any[] },
  onProgress: (pct: number) => void
): Promise<any> {
  return new Promise((resolve) => {
    const formData = new FormData();
    if (data.media) formData.append('media', data.media);
    if (data.textContent) formData.append('textContent', data.textContent);
    if (data.bgColor) formData.append('bgColor', data.bgColor);
    if (data.visibility) formData.append('visibility', data.visibility);
    if (data.stickers?.length) formData.append('stickers', JSON.stringify(data.stickers));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/statuses`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const text = xhr.responseText;
        if (!text) {
          resolve({ success: false, error: { message: `Upload failed (HTTP ${xhr.status}).` } });
          return;
        }
        resolve(JSON.parse(text));
      } catch {
        resolve({ success: false, error: { message: 'Upload failed.' } });
      }
    };
    xhr.onerror = () => resolve({ success: false, error: { message: 'Upload failed.' } });
    xhr.send(formData);
  });
}
