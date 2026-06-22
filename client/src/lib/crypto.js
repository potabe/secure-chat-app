/**
 * crypto.js — Web Crypto API implementation
 * Implements: ECDH (P-256) + HKDF + AES-GCM
 * Zero third-party dependencies — pure browser native crypto.subtle
 */

// ─── Utility: ArrayBuffer ↔ Hex ──────────────────────────────────────────────
export function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

// ─── Fingerprint (SHA-256 hash of buffer → hex) ───────────────────────────────
export async function fingerprintBuffer(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(hash);
}

// ─── ECDH Key Pair Generation ─────────────────────────────────────────────────
export async function generateECDHKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,   // extractable (public key only — private stays in subtle)
    ['deriveKey', 'deriveBits']
  );
  return keyPair;
}

// ─── Export Public Key as JWK ─────────────────────────────────────────────────
export async function exportPublicKeyJWK(publicKey) {
  const jwk = await crypto.subtle.exportKey('jwk', publicKey);
  return jwk;
}

// ─── Import Partner Public Key from JWK ───────────────────────────────────────
export async function importPublicKeyJWK(jwk) {
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
  return publicKey;
}

// ─── ECDH: Derive Shared Secret (raw bits) ────────────────────────────────────
export async function deriveSharedSecret(privateKey, partnerPublicKey) {
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: partnerPublicKey },
    privateKey,
    256   // P-256 → 256 bits
  );
  return sharedSecret;
}

// ─── HKDF: Derive AES Key from Shared Secret ──────────────────────────────────
export async function deriveAESKey(sharedSecretBuffer, keySize = 256, roomPassword = '') {
  // Import shared secret as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    sharedSecretBuffer,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  let saltBuffer;
  if (roomPassword) {
    const encoder = new TextEncoder();
    saltBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(roomPassword));
  } else {
    saltBuffer = new Uint8Array(32); // Zero salt
  }

  // Derive AES-GCM key using HKDF
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: saltBuffer,
      info: new TextEncoder().encode('secure-chat-aes-gcm'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: keySize },  // 128 or 256
    false,   // Non-extractable (stays in subtle)
    ['encrypt', 'decrypt']
  );

  return aesKey;
}

// ─── AES-GCM Encrypt ──────────────────────────────────────────────────────────
export async function encryptMessage(aesKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));  // 96-bit IV for GCM
  const encodedText = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encodedText
  );

  return {
    ciphertext: bufferToHex(ciphertextBuffer),
    iv: bufferToHex(iv.buffer),
  };
}

// ─── AES-GCM Decrypt ──────────────────────────────────────────────────────────
export async function decryptMessage(aesKey, ciphertextHex, ivHex) {
  const ciphertextBuffer = hexToBuffer(ciphertextHex);
  const iv = new Uint8Array(hexToBuffer(ivHex));

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertextBuffer
  );

  return new TextDecoder().decode(plaintextBuffer);
}

// ─── Full Handshake Helper ────────────────────────────────────────────────────
export async function performHandshake(myPrivateKey, partnerPublicKeyJWK, keySize = 256, roomPassword = '') {
  const partnerPublicKey = await importPublicKeyJWK(partnerPublicKeyJWK);
  const sharedSecret = await deriveSharedSecret(myPrivateKey, partnerPublicKey);
  const aesKey = await deriveAESKey(sharedSecret, keySize, roomPassword);
  const fingerprint = await fingerprintBuffer(sharedSecret);

  return { aesKey, sharedSecretFingerprint: fingerprint };
}
