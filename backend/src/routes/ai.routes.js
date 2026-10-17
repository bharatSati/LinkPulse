import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loadWorkspace, requireWorkspaceRole } from '../middleware/workspace.middleware.js';
import { aiLimiter, aiAskLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.use(authenticate);

const workspaceScope = [loadWorkspace, requireWorkspaceRole('viewer')];

router.get('/insights', ...workspaceScope, aiLimiter, aiController.insights);
router.post('/ask', ...workspaceScope, aiAskLimiter, aiController.ask);
router.post('/recommendations', ...workspaceScope, aiLimiter, aiController.recommendations);
router.get('/history', ...workspaceScope, aiController.history);

export default router;
