const DB_NAME = 'frianzo-reels-offline';
const DB_VERSION = 1;
const STORE = 'reels';
const MAX_REELS = 8;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;
const MAX_SINGLE_BYTES = 30 * 1024 * 1024;

type CachedReel = {
  userId: string;
  reel: any;
  blob: Blob;
  size: number;
  cachedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('userCachedAt', ['userId', 'cachedAt'], { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open reel cache'));
  });
}

function keyFor(userId: string, reelId: string) {
  return `${userId}:${reelId}`;
}

async function getAllForUser(userId: string): Promise<CachedReel[]> {
  const db = await openDb();
  try {
    return await new Promise<CachedReel[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).index('userId').getAll(userId);
      request.onsuccess = () => resolve((request.result || []) as CachedReel[]);
      request.onerror = () => reject(request.error || new Error('Failed to read reel cache'));
    });
  } finally {
    db.close();
  }
}

async function deleteKeys(keys: string[]) {
  if (!keys.length) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      keys.forEach((key) => store.delete(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to clean reel cache'));
    });
  } finally {
    db.close();
  }
}

async function putCachedReel(item: CachedReel) {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ ...item, key: keyFor(item.userId, item.reel.id) });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to save reel cache'));
    });
  } finally {
    db.close();
  }
}

export async function cacheReelVideo(userId: string, reel: any): Promise<boolean> {
  if (!userId || !reel?.id || !reel?.videoUrl) return false;
  if (typeof window === 'undefined' || !navigator.onLine) return false;

  try {
    const response = await fetch(reel.videoUrl, { method: 'GET', credentials: 'include' });
    if (!response.ok || response.type === 'opaque') return false;

    const blob = await response.blob();
    if (!blob.size || blob.size > MAX_SINGLE_BYTES) return false;

    const existing = await getAllForUser(userId);
    const existingItem = existing.find((item) => item.reel?.id === reel.id);
    const next: CachedReel = {
      userId,
      reel: { ...reel, videoUrl: reel.videoUrl },
      blob,
      size: blob.size,
      cachedAt: Date.now(),
    };

    const others = existing.filter((item) => item.reel?.id !== reel.id);
    others.sort((a, b) => b.cachedAt - a.cachedAt);

    const kept: CachedReel[] = [next];
    let total = next.size;
    for (const item of others) {
      if (kept.length >= MAX_REELS) break;
      if (total + item.size > MAX_TOTAL_BYTES) continue;
      kept.push(item);
      total += item.size;
    }

    const keepKeys = new Set(kept.map((item) => keyFor(userId, item.reel.id)));
    const removeKeys = existing
      .filter((item) => !keepKeys.has(keyFor(userId, item.reel.id)))
      .map((item) => keyFor(userId, item.reel.id));

    if (existingItem && !removeKeys.includes(keyFor(userId, reel.id))) {
      // Replace the existing cached copy with the newest video/metadata.
    }

    await putCachedReel(next);
    await deleteKeys(removeKeys);
    return true;
  } catch {
    return false;
  }
}

export async function getOfflineReels(userId: string): Promise<Array<{ reel: any; videoUrl: string }>> {
  if (!userId) return [];
  try {
    const items = await getAllForUser(userId);
    items.sort((a, b) => b.cachedAt - a.cachedAt);
    return items.slice(0, MAX_REELS).map((item) => ({
      reel: { ...item.reel },
      videoUrl: URL.createObjectURL(item.blob),
    }));
  } catch {
    return [];
  }
}

export async function clearOfflineReels(userId?: string) {
  if (!userId) return;
  try {
    const items = await getAllForUser(userId);
    await deleteKeys(items.map((item) => keyFor(userId, item.reel.id)));
  } catch {
    // Best-effort cleanup.
  }
}
