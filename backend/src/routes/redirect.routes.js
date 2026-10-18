import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { handleRedirect, handleUnlock } from '../controllers/redirect.controller.js';
import { passwordAttemptLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  // The rendered pages use one small inline script (password visibility
  // toggle). Helmet's default `script-src 'self'` blocks it, so issue a
  // per-request nonce and whitelist it in the CSP header.
  const nonce = randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;
  const csp = res.getHeader('Content-Security-Policy');
  if (typeof csp === 'string') {
    res.setHeader(
      'Content-Security-Policy',
      csp.replace("script-src 'self'", `script-src 'self' 'nonce-${nonce}'`)
    );
  }
  next();
});

router.get('/:shortCode', handleRedirect);
router.post('/:shortCode', passwordAttemptLimiter, handleUnlock);

export default router;
