import crypto from 'node:crypto';

const KEY_LENGTH = 64;
const SCHEME = 'scrypt';

export function hashLinkPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, KEY_LENGTH).toString('hex');
  return `${SCHEME}:${salt}:${derived}`;
}

export function verifyLinkPassword(plainPassword, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;

  const [scheme, salt, hash] = storedHash.split(':');
  if (scheme !== SCHEME || !salt || !hash) return false;

  const derived = crypto.scryptSync(plainPassword, salt, KEY_LENGTH).toString('hex');
  const stored = Buffer.from(hash, 'hex');
  const candidate = Buffer.from(derived, 'hex');

  if (stored.length !== candidate.length) return false;
  return crypto.timingSafeEqual(stored, candidate);
}
