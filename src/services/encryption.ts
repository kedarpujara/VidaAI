import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const KEY_NAME = 'vida.enc.key.v1';

async function getKey() {
  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    const bytes = await Crypto.getRandomBytesAsync(32);
    key = Array.from(bytes).map(b => ('0' + b.toString(16)).slice(-2)).join('');
    await SecureStore.setItemAsync(KEY_NAME, key, { keychainService: KEY_NAME });
  }
  return key;
}

// NOTE: This is an obfuscation-level XOR approach for MVP.
// Replace with AES-GCM before production.
export async function encryptString(plain: string): Promise<string> {
  const key = await getKey();
  const mask = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key);
  const enc = new TextEncoder();
  const p = enc.encode(plain);
  const m = enc.encode(mask);
  const out = new Uint8Array(p.length);
  for (let i = 0; i < p.length; i++) out[i] = p[i] ^ m[i % m.length];
  return Buffer.from(out).toString('base64');
}

export async function decryptString(cipherB64: string): Promise<string> {
  const key = await getKey();
  const mask = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, key);
  const c = Uint8Array.from(Buffer.from(cipherB64, 'base64'));
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const m = enc.encode(mask);
  const out = new Uint8Array(c.length);
  for (let i = 0; i < c.length; i++) out[i] = c[i] ^ m[i % m.length];
  return dec.decode(out);
}
