import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import Link from '../models/Link.js';

export const LINK_STATE = {
  OK: 'ok',
  NOT_FOUND: 'not_found',
  DISABLED: 'disabled',
  EXPIRED: 'expired',
  LIMIT_REACHED: 'limit_reached',
  PASSWORD_REQUIRED: 'password_required',
};

const UNLOCK_SCOPE = 'link-unlock';
const UNLOCK_TTL_SECONDS = 300;

export const UNLOCK_COOKIE = 'lp_unlock';
export const UNLOCK_TTL = UNLOCK_TTL_SECONDS;

export async function findLinkByCode(code) {
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;

  return Link.findOne({
    $or: [{ shortCode: normalized }, { customAlias: normalized }],
  }).select('+password');
}

export function evaluateLink(link, now = new Date()) {
  if (!link) return { state: LINK_STATE.NOT_FOUND, link: null };
  if (link.status !== 'active') return { state: LINK_STATE.DISABLED, link };
  if (link.expiresAt && link.expiresAt.getTime() <= now.getTime()) {
    return { state: LINK_STATE.EXPIRED, link };
  }
  if (link.clickLimit != null && link.clickCount >= link.clickLimit) {
    return { state: LINK_STATE.LIMIT_REACHED, link };
  }
  if (link.password) return { state: LINK_STATE.PASSWORD_REQUIRED, link };
  return { state: LINK_STATE.OK, link };
}

export function resolveDestination(link, device) {
  const rules = link.redirectRules;
  if (!rules || !rules.enabled) return link.originalUrl;

  const devices = rules.devices || {};

  if (device && device !== 'unknown' && devices[device]) {
    return devices[device];
  }

  if (device === 'unknown') {
    return rules.defaultUrl || link.originalUrl;
  }

  return rules.defaultUrl || link.originalUrl;
}

export function createUnlockToken(linkId) {
  return jwt.sign({ sub: String(linkId), scope: UNLOCK_SCOPE }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: UNLOCK_TTL_SECONDS,
  });
}

export function verifyUnlockToken(token, linkId) {
  if (!token || !linkId) return false;
  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    return payload.scope === UNLOCK_SCOPE && payload.sub === String(linkId);
  } catch {
    return false;
  }
}
