const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return { success: false, error: { message: `Request failed (HTTP ${res.status}).` } };
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: { message: `Invalid server response (HTTP ${res.status}).` } };
  }
}

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}/api/admin${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...options,
  });
  return readJson(res);
}

export function fetchAdminOverview() {
  return request('/overview');
}

export function fetchAdminUsers(params: { page?: number; search?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page || 1));
  query.set('limit', '20');
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  return request(`/users?${query.toString()}`);
}

export function updateAdminUserStatus(userId: string, status: 'active' | 'suspended' | 'deactivated') {
  return request(`/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function fetchAdminPosts(params: { page?: number; search?: string } = {}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page || 1));
  query.set('limit', '20');
  if (params.search) query.set('search', params.search);
  return request(`/posts?${query.toString()}`);
}

export function deleteAdminPost(postId: string) {
  return request(`/posts/${postId}`, { method: 'DELETE' });
}

export function fetchAdminReports() {
  return request('/reports');
}

export function deleteAdminComment(commentId: string) {
  return request(`/comments/${commentId}`, { method: 'DELETE' });
}

export function deleteAdminReel(reelId: string) {
  return request(`/reels/${reelId}`, { method: 'DELETE' });
}

export function fetchAdminComments(params: { page?: number; search?: string } = {}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page || 1));
  query.set('limit', '20');
  if (params.search) query.set('search', params.search);
  return request(`/comments?${query.toString()}`);
}

export function updateAdminUserVerification(userId: string, verified: boolean) {
  return request(`/users/${userId}/verification`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verified }),
  });
}


export function fetchAdminVerificationRequests(params: { page?: number; search?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page || 1));
  query.set('limit', '20');
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  return request(`/verification-requests?${query.toString()}`);
}

export function reviewAdminVerificationRequest(requestId: string, action: 'approve' | 'reject', adminNote?: string) {
  return request(`/verification-requests/${requestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, adminNote: adminNote || '' }),
  });
}
