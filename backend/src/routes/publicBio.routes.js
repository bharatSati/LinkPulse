import { Router } from 'express';
import * as publicBioController from '../controllers/publicBio.controller.js';
import { publicLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.get('/bio/:username', publicLimiter, publicBioController.getByUsername);

export default router;
