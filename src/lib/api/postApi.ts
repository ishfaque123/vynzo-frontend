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

export async function fetchFeed(offset = 0) {
  const res = await fetch(`${API_URL}/api/posts?offset=${offset}`, { credentials: 'include', cache: 'no-store' });
  return readJson(res);
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
  if (image) formData.append('image', image);
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
