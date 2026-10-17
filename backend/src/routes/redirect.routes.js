import { Router } from 'express';
import { handleRedirect, handleUnlock } from '../controllers/redirect.controller.js';
import { passwordAttemptLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.get('/:shortCode', handleRedirect);
router.post('/:shortCode', passwordAttemptLimiter, handleUnlock);

export default router;
