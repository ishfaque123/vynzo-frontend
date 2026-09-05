const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchFeed() {
  const res = await fetch(`${API_URL}/api/posts`, { credentials: 'include' });
  return res.json();
}

export async function createPost(
  content: string,
  image?: File | null,
  visibility: 'public' | 'private' = 'public',
  taggedUserIds: string[] = []
) {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('visibility', visibility);
  formData.append('taggedUserIds', JSON.stringify(taggedUserIds));
  if (image) formData.append('image', image);

  const res = await fetch(`${API_URL}/api/posts`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return res.json();
}

export async function toggleLike(postId: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}

export async function sharePost(postId: string, content: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}/share`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res.json();
}
