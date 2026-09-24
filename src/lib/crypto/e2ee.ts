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

export async function getOrCreateIdentity(
  userId?: string,
  serverPublicKey?: string | null
): Promise<{ privateKey: CryptoKey; publicKeyJson: string }> {
  if (typeof window === 'undefined') {
    throw new Error('E2EE identity is only available in the browser.');
  }

  const scopedStorage = userId ? `${PRIVATE_KEY_STORAGE_PREFIX}${userId}` : null;
  const scopedStored = scopedStorage ? localStorage.getItem(scopedStorage) : null;

  if (scopedStored) {
    const identity = await importPrivateKey(scopedStored);
    if (identity) return identity;
    localStorage.removeItem(scopedStorage);
  }

  // Migrate the old device-wide key only when its public half exactly matches
  // the public key already stored for this account. This prevents Account B
  // from accidentally inheriting Account A's private key.
  if (userId && serverPublicKey) {
    const legacyStored = localStorage.getItem(PRIVATE_KEY_STORAGE);
    if (legacyStored) {
      const legacyIdentity = await importPrivateKey(legacyStored);
      const serverPublic = normalizePublicKey(serverPublicKey);
      const legacyPublic = legacyIdentity ? normalizePublicKey(legacyIdentity.publicKeyJson) : null;
      if (legacyIdentity && serverPublic && legacyPublic === serverPublic) {
        localStorage.setItem(scopedStorage!, legacyStored);
        return legacyIdentity;
      }
    }
  }

  const pair = await generateKeyPair();
  const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const serializedPrivate = JSON.stringify(privateJwk);
  if (scopedStorage) {
    localStorage.setItem(scopedStorage, serializedPrivate);
  } else {
    localStorage.setItem(PRIVATE_KEY_STORAGE, serializedPrivate);
  }
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