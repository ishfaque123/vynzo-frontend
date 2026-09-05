const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchComments(postId: string) {
  const res = await fetch(`${API_URL}/api/comments/${postId}`, { credentials: 'include' });
  return res.json();
}

export async function addComment(postId: string, content: string) {
  const res = await fetch(`${API_URL}/api/comments/${postId}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function deleteComment(commentId: string) {
  const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
}
