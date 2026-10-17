import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validateBody({
    name: { required: true, type: 'string', minLength: 2, maxLength: 80 },
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 8, maxLength: 128 },
  }),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateBody({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 1, maxLength: 128 },
  }),
  authController.login
);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.me);

export default router;
