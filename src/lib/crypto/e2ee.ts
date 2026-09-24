'use client';

const PRIVATE_KEY_STORAGE = 'vynzo_e2ee_private_jwk';
const PRIVATE_KEY_STORAGE_PREFIX = 'vynzo_e2ee_private_jwk:';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
}

function normalizePublicKey(publicKeyJson: string): string | null {
  try {
    const jwk = JSON.parse(publicKeyJson);
    return JSON.stringify({
      kty: jwk.kty,
      crv: jwk.crv,
      x: jwk.x,
      y: jwk.y,
    });
  } catch {
    return null;
  }
}

async function publicKeyFromPrivate(privateKey: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey('jwk', privateKey);
  return JSON.stringify({
    kty: jwk.kty,
    crv: jwk.crv,
    x: jwk.x,
    y: jwk.y,
  });
}

async function importPrivateKey(stored: string): Promise<{ privateKey: CryptoKey; publicKeyJson: string } | null> {
  try {
    const jwk = JSON.parse(stored);
    const privateKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
    return { privateKey, publicKeyJson: await publicKeyFromPrivate(privateKey) };
  } catch {
    return null;
  }
}

// If two callers ask for the identity at nearly the same time (e.g. the
// app shell and a page both mount and call this on load), without this
// cache each one could independently decide no key exists yet and
// generate a *different* one, with whichever write happens last silently
// winning. That leaves a mismatch between the key actually used to
// encrypt a just-sent message and the key loaded after a reload, so the
// message can never be decrypted again. Caching the in-flight/resolved
// promise per user ensures every caller gets the exact same identity.
const identityPromiseCache = new Map<string, Promise<{ privateKey: CryptoKey; publicKeyJson: string }>>();

export async function getOrCreateIdentity(
  userId: string,
  serverPublicKey?: string | null
): Promise<{ privateKey: CryptoKey; publicKeyJson: string }> {
  if (!userId) {
    // Never generate or reuse a shared, unscoped identity: a message
    // encrypted with a key that isn't tied to the signed-in account can
    // never be decrypted again, by anyone, ever. Every caller must wait
    // until the real signed-in user id is known before asking for one.
    throw new Error('E2EE identity requires a signed-in user id.');
  }

  const cached = identityPromiseCache.get(userId);
  if (cached) return cached;

  const promise = getOrCreateIdentityUncached(userId, serverPublicKey);
  identityPromiseCache.set(userId, promise);
  try {
    return await promise;
  } catch (err) {
    identityPromiseCache.delete(userId);
    throw err;
  }
}

async function getOrCreateIdentityUncached(
  userId: string,
  serverPublicKey?: string | null
): Promise<{ privateKey: CryptoKey; publicKeyJson: string }> {
  if (typeof window === 'undefined') {
    throw new Error('E2EE identity is only available in the browser.');
  }

  const scopedStorage = `${PRIVATE_KEY_STORAGE_PREFIX}${userId}`;
  const scopedStored = localStorage.getItem(scopedStorage);

  if (scopedStored) {
    const identity = await importPrivateKey(scopedStored);
    if (identity) return identity;
    localStorage.removeItem(scopedStorage);
  }

  // Migrate the old device-wide key only when its public half exactly matches
  // the public key already stored for this account. This prevents Account B
  // from accidentally inheriting Account A's private key.
  if (serverPublicKey) {
    const legacyStored = localStorage.getItem(PRIVATE_KEY_STORAGE);
    if (legacyStored) {
      const legacyIdentity = await importPrivateKey(legacyStored);
      const serverPublic = normalizePublicKey(serverPublicKey);
      const legacyPublic = legacyIdentity ? normalizePublicKey(legacyIdentity.publicKeyJson) : null;
      if (legacyIdentity && serverPublic && legacyPublic === serverPublic) {
        localStorage.setItem(scopedStorage, legacyStored);
        return legacyIdentity;
      }
    }
  }

  const pair = await generateKeyPair();
  const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const serializedPrivate = JSON.stringify(privateJwk);
  localStorage.setItem(scopedStorage, serializedPrivate);
  const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { privateKey: pair.privateKey, publicKeyJson: JSON.stringify(publicJwk) };
}

export async function deriveSharedKey(privateKey: CryptoKey, otherPublicKeyJson: string): Promise<CryptoKey | null> {
  try {
    const otherJwk = JSON.parse(otherPublicKeyJson);
    const otherPublicKey = await crypto.subtle.importKey(
      'jwk',
      otherJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );
    return await crypto.subtle.deriveKey(
      { name: 'ECDH', public: otherPublicKey },
      privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch {
    return null;
  }
}

export async function encryptText(sharedKey: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, sharedKey, data as BufferSource);
  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(cipherBuf))}`;
}

export async function tryDecryptText(sharedKey: CryptoKey | null, payload: string): Promise<string> {
  if (!sharedKey || !payload) return payload;
  const parts = payload.split(':');
  if (parts.length !== 2) return payload;
  try {
    const iv = base64ToBytes(parts[0]);
    const data = base64ToBytes(parts[1]);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, sharedKey, data as BufferSource);
    return new TextDecoder().decode(plainBuf);
  } catch {
    return '';
  }
}