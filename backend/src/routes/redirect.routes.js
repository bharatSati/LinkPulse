import { Router } from 'express';
import { handleRedirect, handleUnlock } from '../controllers/redirect.controller.js';
import { passwordAttemptLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

router.get('/:shortCode', handleRedirect);
router.post('/:shortCode', passwordAttemptLimiter, handleUnlock);

export default router;
