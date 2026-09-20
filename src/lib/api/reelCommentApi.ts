const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request(path: string, init?: RequestInit) {
  try {
    if (!API_URL) throw new Error('API is not configured.');
    const res = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include' });
    const text = await res.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!res.ok) return { success: false, error: { message: data?.error?.message || data?.message || `Request failed (${res.status}).` } };
    return data;
  } catch (error: any) {
    return { success: false, error: { message: error?.message || 'Unable to connect to the server.' } };
  }
}

export async function fetchReelComments(reelId: string, cursor?: string | null, limit = 20) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);
  return request(`/api/reels/${encodeURIComponent(reelId)}/comments?${params.toString()}`);
}

export async function addReelComment(reelId: string, content: string, parentCommentId?: string) {
  return request(`/api/reels/${encodeURIComponent(reelId)}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, parentCommentId }),
  });
}

export async function setReelCommentReaction(commentId: string, type: string) {
  return request(`/api/reels/comments/${encodeURIComponent(commentId)}/reaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
}

export async function editReelComment(commentId: string, content: string) {
  return request(`/api/reels/comments/${encodeURIComponent(commentId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

export async function deleteReelComment(commentId: string) {
  return request(`/api/reels/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
}
