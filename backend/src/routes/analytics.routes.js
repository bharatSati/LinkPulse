import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { streamClicks } from '../controllers/realtime.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loadWorkspace, requireWorkspaceRole } from '../middleware/workspace.middleware.js';
import { loadLinkAccess } from '../middleware/link.middleware.js';

const router = Router();

router.use(authenticate);

const workspaceScope = [loadWorkspace, requireWorkspaceRole('viewer')];

router.get('/stream', ...workspaceScope, streamClicks);
router.get('/overview', ...workspaceScope, analyticsController.overview);
router.get('/clicks-over-time', ...workspaceScope, analyticsController.clicksOverTime);
router.get('/top-links', ...workspaceScope, analyticsController.topLinks);
router.get('/referrers', ...workspaceScope, analyticsController.referrers);
router.get('/devices', ...workspaceScope, analyticsController.devices);
router.get('/browsers', ...workspaceScope, analyticsController.browsers);
router.get('/locations', ...workspaceScope, analyticsController.locations);

router.get(
  '/links/:linkId',
  loadLinkAccess,
  requireWorkspaceRole('viewer'),
  analyticsController.linkAnalytics
);

export default router;
