'use client';

// Lightweight end-to-end encryption for chat text messages using the
// browser's built-in Web Crypto API: ECDH (P-256) to derive a shared
// secret between two users, then AES-GCM to encrypt/decrypt with it.
// The server only ever sees ciphertext.
//
// Scope/limits (by design, documented for future-us):
// - Per-device: the private key lives only in this browser's localStorage.
//   Opening the account on a new device/browser starts a fresh keypair, so
//   history encrypted under the old key can't be decrypted there.
// - No forward secrecy / ratcheting like Signal — one shared key per
//   conversation, not one per message.
// - Media (photos/voice) are NOT encrypted, only text content.

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

// Returns this device's private key (creating + persisting one on first
// use) and the matching public key as a JSON string ready to upload.
export async function getOrCreateIdentity(): Promise<{ privateKey: CryptoKey; publicKeyJson: string }> {
  const stored = localStorage.getItem(PRIVATE_KEY_STORAGE);
  if (stored) {
    const jwk = JSON.parse(stored);
    const privateKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
    const publicJwk = { ...jwk };
    delete publicJwk.d;
    return { privateKey, publicKeyJson: JSON.stringify(publicJwk) };
  }

  const pair = await generateKeyPair();
  const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  localStorage.setItem(PRIVATE_KEY_STORAGE, JSON.stringify(privateJwk));
  const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { privateKey: pair.privateKey, publicKeyJson: JSON.stringify(publicJwk) };
}

// Combines our private key with the other person's public key to get the
// one shared AES key both sides will independently arrive at.
export async function deriveSharedKey(privateKey: CryptoKey, otherPublicKeyJson: string): Promise<CryptoKey | null> {
  try {
    const otherJwk = JSON.parse(otherPublicKeyJson);
    const otherPublicKey = await crypto.subtle.importKey('jwk', otherJwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
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
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, data);
  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(cipherBuf))}`;
}

// Gracefully falls back to returning the payload as-is if it isn't our
// "iv:ciphertext" format (legacy plaintext messages sent before this
// feature) or if it can't be decrypted with the given key.
export async function tryDecryptText(sharedKey: CryptoKey | null, payload: string): Promise<string> {
  if (!sharedKey || !payload) return payload;
  const parts = payload.split(':');
  if (parts.length !== 2) return payload;
  try {
    const iv = base64ToBytes(parts[0]);
    const data = base64ToBytes(parts[1]);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedKey, data);
    return new TextDecoder().decode(plainBuf);
  } catch {
    return payload;
  }
}
