import { getPublicBaseUrl } from '../services/api.js';

export function resolveShortUrl(link) {
  const code = link?.customAlias || link?.shortCode;
  if (!code) return '';

  const base = getPublicBaseUrl();
  if (base) return `${base}/${code}`;
  return link?.shortUrl || `/${code}`;
}

export function linkDisplayStatus(link) {
  if (link.status === 'disabled') {
    return { label: 'Disabled', tone: 'neutral' };
  }
  if (link.isExpired) {
    return { label: 'Expired', tone: 'warn' };
  }
  if (link.isLimitReached) {
    return { label: 'Limit reached', tone: 'danger' };
  }
  if (link.hasPassword) {
    return { label: 'Protected', tone: 'warn' };
  }
  return { label: 'Active', tone: 'accent' };
}

export function isHttpUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidAlias(value) {
  return /^[a-z0-9][a-z0-9-_]{2,49}$/i.test(value.trim());
}
