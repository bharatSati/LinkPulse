import { Router } from 'express';
import * as linkController from '../controllers/link.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loadWorkspace, requireWorkspaceRole } from '../middleware/workspace.middleware.js';
import { loadLinkAccess } from '../middleware/link.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', loadWorkspace, requireWorkspaceRole('editor'), linkController.create);

router.get('/', loadWorkspace, requireWorkspaceRole('viewer'), linkController.list);

router.get('/:id', loadLinkAccess, requireWorkspaceRole('viewer'), linkController.getOne);

router.patch('/:id', loadLinkAccess, requireWorkspaceRole('editor'), linkController.update);

router.delete('/:id', loadLinkAccess, requireWorkspaceRole('editor'), linkController.remove);

export default router;
