const DB_NAME = 'frianzo-offline';
const DB_VERSION = 1;
const STORE = 'data';

type StoredValue = {
  key: string;
  value: any;
  updatedAt: number;
};

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open offline database'));
  });
}

async function putValue(key: string, value: any) {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ key, value, updatedAt: Date.now() } satisfies StoredValue);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Offline cache write failed'));
    });
    db.close();
  } catch {
    // Offline caching is best-effort and must never break the online app.
  }
}

async function getValue<T>(key: string): Promise<T | null> {
  try {
    const db = await openOfflineDb();
    const value = await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve((request.result as StoredValue | undefined)?.value ?? null);
      request.onerror = () => reject(request.error || new Error('Offline cache read failed'));
    });
    db.close();
    return value;
  } catch {
    return null;
  }
}

export async function saveOfflineUser(user: any) {
  if (!user?.id) return;
  await putValue('current-user', user);
}

export async function getOfflineUser<T = any>(): Promise<T | null> {
  return getValue<T>('current-user');
}

export async function saveOfflineFeed(userId: string, posts: any[], hasMore: boolean) {
  if (!userId || !Array.isArray(posts) || posts.length === 0) return;
  await putValue(`feed:${userId}`, { posts, hasMore });
}

export async function getOfflineFeed<T = any>(userId: string): Promise<{ posts: T[]; hasMore: boolean } | null> {
  if (!userId) return null;
  return getValue<{ posts: T[]; hasMore: boolean }>(`feed:${userId}`);
}

export async function clearOfflineCache() {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Offline cache clear failed'));
    });
    db.close();
  } catch {
    // Best-effort cleanup.
  }
}
