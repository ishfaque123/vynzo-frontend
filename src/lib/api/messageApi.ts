const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { compressImageFile } from '../compressImage';

export async function fetchConversations() {
  const res = await fetch(`${API_URL}/api/messages/conversations`, { credentials: 'include' });
  return res.json();
}

export async function createConversation(userId: string) {
  const res = await fetch(`${API_URL}/api/messages/conversations`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function deleteConversation(conversationId: string) {
  const res = await fetch(`${API_URL}/api/messages/conversations/${conversationId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
}

export async function fetchMessages(conversationId: string, cursor?: string) {
  const url = new URL(`${API_URL}/api/messages/conversations/${conversationId}/messages`);
  if (cursor) url.searchParams.set('cursor', cursor);
  const res = await fetch(url.toString(), { credentials: 'include' });
  return res.json();
}

export async function uploadChatMedia(file: File | Blob, filename: string) {
  const out = file instanceof File ? await compressImageFile(file) : file;
  const formData = new FormData();
  formData.append('file', out, out !== file ? (out as File).name : filename);
  const res = await fetch(`${API_URL}/api/upload/chat`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return res.json();
}

export async function setDisappearing(conversationId: string, duration: number | null) {
  const res = await fetch(`${API_URL}/api/messages/conversations/${conversationId}/disappearing`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration }),
  });
  return res.json();
}
