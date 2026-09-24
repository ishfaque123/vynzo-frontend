'use client';

const PRIVATE_KEY_STORAGE = 'vynzo_e2ee_private_jwk';

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

export async function getOrCreateIdentity(): Promise<{ privateKey: CryptoKey; publicKeyJson: string }> {
  const stored = localStorage.getItem(PRIVATE_KEY_STORAGE);
  if (stored) {
    const jwk = JSON.parse(stored);
    const privateKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
    const publicJwk = { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true, key_ops: [] };
    return { privateKey, publicKeyJson: JSON.stringify(publicJwk) };
  }
  const pair = await generateKeyPair();
  const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  localStorage.setItem(PRIVATE_KEY_STORAGE, JSON.stringify(privateJwk));
  const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { privateKey: pair.privateKey, publicKeyJson: JSON.stringify(publicJwk) };
}

export async function deriveSharedKey(privateKey: CryptoKey, otherPublicKeyJson: string): Promise<CryptoKey | null> {
  try {
    const otherJwk = JSON.parse(otherPublicKeyJson);
    const otherPublicKey = await crypto.subtle.importKey('jwk', otherJwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
    return await crypto.subtle.deriveKey({ name: 'ECDH', public: otherPublicKey }, privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  } catch { return null; }
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