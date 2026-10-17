import { Router } from 'express';
import * as campaignController from '../controllers/campaign.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loadWorkspace, requireWorkspaceRole } from '../middleware/workspace.middleware.js';
import { loadCampaignAccess } from '../middleware/campaign.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', loadWorkspace, requireWorkspaceRole('editor'), campaignController.create);
router.get('/', loadWorkspace, requireWorkspaceRole('viewer'), campaignController.list);

router.get('/:id', loadCampaignAccess, requireWorkspaceRole('viewer'), campaignController.getOne);
router.patch('/:id', loadCampaignAccess, requireWorkspaceRole('editor'), campaignController.update);
router.delete('/:id', loadCampaignAccess, requireWorkspaceRole('editor'), campaignController.remove);

router.get(
  '/:id/links',
  loadCampaignAccess,
  requireWorkspaceRole('viewer'),
  campaignController.listLinks
);
router.get(
  '/:id/analytics',
  loadCampaignAccess,
  requireWorkspaceRole('viewer'),
  campaignController.analytics
);

export default router;
