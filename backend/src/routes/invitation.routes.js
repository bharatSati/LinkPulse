import { Router } from 'express';
import * as invitationController from '../controllers/invitation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();

const tokenRule = {
  required: true,
  type: 'string',
  minLength: 32,
  maxLength: 128,
};

router.get('/:token', invitationController.preview);

router.post('/accept', authenticate, validateBody({ token: tokenRule }), invitationController.accept);

router.post('/reject', authenticate, validateBody({ token: tokenRule }), invitationController.reject);

export default router;
