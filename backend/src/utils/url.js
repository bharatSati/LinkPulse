const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export function isValidHttpUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;

  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    return false;
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return false;

  return Boolean(parsed.hostname);
}

export function normalizeUrl(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  try {
    return new URL(trimmed).toString();
  } catch {
    return trimmed;
  }
}

export const RESERVED_CODES = new Set([
  'api',
  'health',
  'app',
  'login',
  'register',
  'logout',
  'dashboard',
  'admin',
  'settings',
  'static',
  'assets',
  'public',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'manifest.json',
]);

const ALIAS_PATTERN = /^[a-z0-9][a-z0-9-_]{2,49}$/i;

export function isValidAlias(value) {
  if (typeof value !== 'string') return false;
  const alias = value.trim().toLowerCase();
  if (alias.length < 3 || alias.length > 50) return false;
  if (!ALIAS_PATTERN.test(alias)) return false;
  return !RESERVED_CODES.has(alias);
}

export function normalizeAlias(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
