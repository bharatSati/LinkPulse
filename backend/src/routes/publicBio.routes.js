import { Router } from 'express';
import * as publicBioController from '../controllers/publicBio.controller.js';

const router = Router();

router.get('/bio/:username', publicBioController.getByUsername);

export default router;
