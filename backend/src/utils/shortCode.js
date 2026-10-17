import crypto from 'node:crypto';
import { RESERVED_CODES } from './url.js';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const DEFAULT_LENGTH = 7;
const MAX_ATTEMPTS = 8;

export function randomCode(length = DEFAULT_LENGTH) {
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export async function generateUniqueCode(isTaken, length = DEFAULT_LENGTH) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = randomCode(length);
    if (RESERVED_CODES.has(candidate)) continue;
    if (!(await isTaken(candidate))) return candidate;
  }

  throw new Error('Unable to generate a unique short code after multiple attempts');
}
