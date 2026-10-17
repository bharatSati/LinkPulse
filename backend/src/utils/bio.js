import { RESERVED_CODES } from './url.js';

export const MAX_BIO_LINKS = 50;
export const MAX_BIO_SOCIAL_LINKS = 12;
export const MAX_BIO_TITLE = 80;
export const MAX_BIO_DESCRIPTION = 300;
export const MAX_BIO_LINK_TITLE = 120;

export const BIO_BUTTON_STYLES = ['solid', 'outline', 'soft', 'shadow'];
export const BIO_THEMES = ['dark', 'light', 'gradient'];

export const BIO_SOCIAL_PLATFORMS = [
  'website',
  'twitter',
  'instagram',
  'facebook',
  'linkedin',
  'youtube',
  'tiktok',
  'github',
  'email',
  'other',
];

export const DEFAULT_BACKGROUND_COLOR = '#0b0d10';
export const DEFAULT_TEXT_COLOR = '#f3f5f7';

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/;
const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function isValidUsername(value) {
  const username = normalizeUsername(value);
  if (username.length < 3 || username.length > 30) return false;
  if (!USERNAME_PATTERN.test(username)) return false;
  return !RESERVED_CODES.has(username);
}

export function usernameError(value) {
  const username = normalizeUsername(value);
  if (!username) return 'Username is required';
  if (username.length < 3 || username.length > 30) {
    return 'Username must be 3-30 characters long';
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Use lowercase letters, numbers, hyphens, or underscores';
  }
  if (RESERVED_CODES.has(username)) return 'This username is reserved';
  return null;
}

export function isHexColor(value) {
  return typeof value === 'string' && HEX_PATTERN.test(value.trim());
}

export function normalizeHex(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (!isHexColor(value)) return null;
  const hex = value.trim().slice(1).toLowerCase();
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }
  return `#${hex}`;
}

export function isMailto(value) {
  return typeof value === 'string' && /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value.trim());
}
