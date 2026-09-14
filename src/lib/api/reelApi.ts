const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchReelsConfig() {
  const res = await fetch(`${API_URL}/api/reels/config`, { credentials: 'include' });
  return res.json();
}

export async function fetchReelFeed(offset = 0) {
  const res = await fetch(`${API_URL}/api/reels?offset=${offset}`, { credentials: 'include' });
  return res.json();
}

export async function fetchMyReelStatus() {
  const res = await fetch(`${API_URL}/api/reels/me/status`, { credentials: 'include' });
  return res.json();
}

export async function fetchFavoriteReels() {
  const res = await fetch(`${API_URL}/api/reels/me/favorites`, { credentials: 'include' });
  return res.json();
}

export async function toggleReelLike(reelId: string) {
  const res = await fetch(`${API_URL}/api/reels/${reelId}/like`, { method: 'POST', credentials: 'include' });
  return res.json();
}

export async function toggleReelFavorite(reelId: string) {
  const res = await fetch(`${API_URL}/api/reels/${reelId}/favorite`, { method: 'POST', credentials: 'include' });
  return res.json();
}

export async function deleteReel(reelId: string) {
  const res = await fetch(`${API_URL}/api/reels/${reelId}`, { method: 'DELETE', credentials: 'include' });
  return res.json();
}

// Uses XMLHttpRequest instead of fetch so we can report upload progress
// (fetch has no reliable cross-browser upload-progress event).
export function createReelWithProgress(
  data: { video: File; caption?: string; durationSec?: number },
  onProgress: (pct: number) => void
): Promise<any> {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('video', data.video);
    if (data.caption) formData.append('caption', data.caption);
    if (data.durationSec) formData.append('durationSec', String(Math.round(data.durationSec)));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/reels`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        resolve({ success: false, error: { message: 'Upload failed.' } });
      }
    };
    xhr.onerror = () => resolve({ success: false, error: { message: 'Upload failed.' } });
    xhr.send(formData);
  });
}
