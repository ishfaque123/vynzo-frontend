const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { compressImageFile } from '../compressImage';

// Retry delays for 429 (rate limit): 3s, 7s, 15s
const RETRY_DELAYS = [3000, 7000, 15000];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

export async function fetchContentMix(timeoutMs = 30000) {
  // Same 30s timeout as fetchFeed: without it, a stalled content-mix
  // request blocks HomeClient's Promise.all forever and the feed skeleton
  // never clears, even when posts already arrived. Callers (HomeClient)
  // already .catch() this to null, so a timeout degrades to the default mix.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}/api/posts/content-mix`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFeed(offset = 0, timeoutMs = 30000, retries = 1, rateLimitRetries = 3) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}/api/posts?offset=${offset}`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
    // Auto-retry on 429 (rate limit) with backoff: 3s, 7s, 15s
    if (res.status === 429 && rateLimitRetries > 0) {
      const delay = RETRY_DELAYS[3 - rateLimitRetries] || 15000;
      await sleep(delay);
      return fetchFeed(offset, timeoutMs, retries, rateLimitRetries - 1);
    }
    return readJson(res);
  } catch (err: any) {
    // Retry once on timeout/abort (common on slow mobile data)
    if (retries > 0 && (err?.name === 'AbortError' || err?.message?.includes('abort'))) {
      return fetchFeed(offset, timeoutMs, retries - 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchUserPosts(username: string) {
  const res = await fetch(`${API_URL}/api/posts/user/${username}`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
}

export async function createPost(content: string, image?: File | null, visibility: 'public' | 'private' = 'public', taggedUserIds: string[] = []) {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('visibility', visibility);
  formData.append('taggedUserIds', JSON.stringify(taggedUserIds));
  if (image) formData.append('image', await compressImageFile(image));
  const res = await fetch(`${API_URL}/api/posts`, { method: 'POST', credentials: 'include', cache: 'no-store', body: formData });
  return readJson(res);
}

export async function setReaction(postId: string, type: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}/reaction`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  return readJson(res);
}

export async function sharePost(postId: string, content: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}/share`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return readJson(res);
}

export async function updatePost(postId: string, data: { content?: string; commentAudience?: string }) {
  const res = await fetch(`${API_URL}/api/posts/${postId}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return readJson(res);
}

export async function deletePost(postId: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}`, {
    method: 'DELETE', credentials: 'include',
  });
  return readJson(res);
}

export async function reportPost(postId: string, reason: string = 'other', details?: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}/report`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, details }),
  });
  return readJson(res);
}

export async function recordPostView(postId: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}/view`, {
    method: 'POST', credentials: 'include',
  });
  return readJson(res);
}

export async function hidePost(postId: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}/hide`, {
    method: 'POST', credentials: 'include',
  });
  return readJson(res);
}

export async function togglePinPost(postId: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}/pin`, {
    method: 'POST', credentials: 'include',
  });
  return readJson(res);
}
