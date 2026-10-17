import { Router } from 'express';
import * as abuseController from '../controllers/abuse.controller.js';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { abuseReportLimiter } from '../middleware/rateLimit.middleware.js';
import { ABUSE_REASONS } from '../models/AbuseReport.js';

const router = Router();

router.post(
  '/reports',
  abuseReportLimiter,
  optionalAuthenticate,
  validateBody({
    code: { required: true, type: 'string', minLength: 1, maxLength: 60 },
    reason: { required: true, type: 'string', enum: ABUSE_REASONS },
    description: { type: 'string', maxLength: 1000 },
  }),
  abuseController.submitReport
);

export default router;
