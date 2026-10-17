import { Router } from 'express';
import * as bioPageController from '../controllers/bioPage.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loadWorkspace, requireWorkspaceRole } from '../middleware/workspace.middleware.js';
import { loadBioPageAccess } from '../middleware/bioPage.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/check-username', bioPageController.checkUsername);

router.post('/', loadWorkspace, requireWorkspaceRole('editor'), bioPageController.create);

router.get('/', loadWorkspace, requireWorkspaceRole('viewer'), bioPageController.list);

router.get('/:id', loadBioPageAccess, requireWorkspaceRole('viewer'), bioPageController.getOne);

router.patch('/:id', loadBioPageAccess, requireWorkspaceRole('editor'), bioPageController.update);

router.patch(
  '/:id/publish',
  loadBioPageAccess,
  requireWorkspaceRole('editor'),
  bioPageController.publish
);

router.delete('/:id', loadBioPageAccess, requireWorkspaceRole('editor'), bioPageController.remove);

export default router;
