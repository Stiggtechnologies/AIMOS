// ============================================================
// Collision-resistant identifier helpers backed by the Web Crypto API.
// Prefer these over Math.random() for anything persisted or user-facing
// (invoice / claim / receipt numbers, asset tags, etc.).
// ============================================================

/** Lowercase hex token with `bytes` of entropy (default 8 bytes = 16 chars). */
export function randomToken(bytes = 8): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Uppercase alphanumeric code (Crockford-ish), e.g. for confirmation codes. */
export function randomCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => alphabet[b % alphabet.length]).join('');
}

/** Zero-padded decimal string with `n` digits, crypto-sourced. */
export function randomDigits(n: number): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const mod = 10 ** n;
  return (arr[0] % mod).toString().padStart(n, '0');
}
