const FORBIDDEN_KEY = /^\$|\./;
const FORBIDDEN_EXACT = new Set(['__proto__', 'constructor', 'prototype']);

function sanitize(value) {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      value[index] = sanitize(value[index]);
    }
    return value;
  }

  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEY.test(key) || FORBIDDEN_EXACT.has(key)) {
      delete value[key];
      continue;
    }
    value[key] = sanitize(value[key]);
  }

  return value;
}

/*
 * Strips MongoDB operators ($-prefixed and dotted keys) and prototype-pollution
 * keys from every request payload before validation. This blocks operator
 * injection (e.g. `{ "email": { "$gt": "" } }`) and nested pollution attacks.
 */
export default function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object') sanitize(req.body);
  if (req.params && typeof req.params === 'object') sanitize(req.params);
  if (req.query && typeof req.query === 'object') sanitize(req.query);
  return next();
}
