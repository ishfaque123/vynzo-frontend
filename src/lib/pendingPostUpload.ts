// Background post upload holder (Facebook-style posting flow).
//
// The New Post composer used to run the create-post XHR itself, so the
// user had to stay on the composer watching "Posting..." until the
// upload finished. Now the composer hands the ready-to-send FormData to
// this module-level store and navigates straight to the feed; the XHR
// keeps running here because this module (and the Shell that renders
// the progress bar) survives client-side navigation.
//
// One upload at a time. The payload (text + photo) stays in memory so a
// failed upload can be retried exactly as composed; nothing is
// persisted, so a full app close or page refresh loses an in-flight
// post — the same behaviour as Facebook's web composer.
//
// State changes always replace the state object (never mutate it) so
// subscribers using useSyncExternalStore see every update.

import { setPendingNewPost } from '@/lib/pendingNewPost';
import { playPostSound } from '@/lib/sounds';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type PendingPostStatus = 'posting' | 'published' | 'failed';

export interface PendingPostUpload {
  formData: FormData;
  imagePreviewUrl: string | null;
  progress: number;
  status: PendingPostStatus;
  error: string | null;
}

let current: PendingPostUpload | null = null;
let xhr: XMLHttpRequest | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function update(patch: Partial<PendingPostUpload>) {
  if (!current) return;
  current = { ...current, ...patch };
  emit();
}

export function subscribePendingPostUpload(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPendingPostUpload(): PendingPostUpload | null {
  return current;
}

// Starts the background upload. Returns false when another post is
// already being published, so the caller can keep the user in the
// composer with an explanation instead of dropping a post.
export function startPendingPostUpload(formData: FormData, imagePreviewUrl: string | null): boolean {
  if (current && current.status === 'posting') return false;
  if (current?.imagePreviewUrl && current.imagePreviewUrl !== imagePreviewUrl) {
    URL.revokeObjectURL(current.imagePreviewUrl);
  }
  current = { formData, imagePreviewUrl, progress: 0, status: 'posting', error: null };
  emit();
  sendCurrent();
  return true;
}

function sendCurrent() {
  if (!current) return;
  const req = new XMLHttpRequest();
  xhr = req;
  req.open('POST', `${API_URL}/api/posts`);
  req.withCredentials = true;

  req.upload.onprogress = (event) => {
    if (xhr !== req || !current) return;
    if (event.lengthComputable) {
      update({ progress: Math.round((event.loaded / event.total) * 100) });
    }
  };

  req.onload = () => {
    if (xhr !== req || !current) return;
    let result: any = null;
    try { result = JSON.parse(req.responseText); } catch {}
    if (req.status >= 200 && req.status < 300 && result?.success) {
      update({ progress: 100, status: 'published' });
      playPostSound();
      // Same optimistic-prepend store the old composer flow used, plus
      // an event for a home feed that is already on screen: in this
      // flow the publish normally finishes after the feed has mounted,
      // so its loadFeed() has already run and would never see the post.
      if (result.data?.post) {
        setPendingNewPost(result.data.post);
        window.dispatchEvent(new CustomEvent('frianzo:post-published'));
      }
    } else {
      update({ status: 'failed', error: result?.error?.message || 'Failed to create post' });
    }
  };

  req.onerror = () => {
    if (xhr !== req || !current) return;
    update({ status: 'failed', error: 'Network error. Please try again.' });
  };

  req.send(current.formData);
}

// Re-sends the exact same payload after a failure — the composed text
// and photo are still held in memory, so nothing has to be retyped.
export function retryPendingPostUpload() {
  if (!current || current.status !== 'failed') return;
  update({ status: 'posting', progress: 0, error: null });
  sendCurrent();
}

// Drops the held post: aborts an in-flight upload, releases the photo
// preview URL and clears the bar. Also used to dismiss the "published"
// confirmation once it has been shown.
export function discardPendingPostUpload() {
  if (!current) return;
  if (xhr && current.status === 'posting') xhr.abort();
  xhr = null;
  if (current.imagePreviewUrl) URL.revokeObjectURL(current.imagePreviewUrl);
  current = null;
  emit();
}
