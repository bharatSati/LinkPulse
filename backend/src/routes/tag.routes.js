import { Router } from 'express';
import * as tagController from '../controllers/tag.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loadWorkspace, requireWorkspaceRole } from '../middleware/workspace.middleware.js';
import { loadTagAccess } from '../middleware/tag.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', loadWorkspace, requireWorkspaceRole('editor'), tagController.create);
router.get('/', loadWorkspace, requireWorkspaceRole('viewer'), tagController.list);

router.patch('/:id', loadTagAccess, requireWorkspaceRole('editor'), tagController.update);
router.delete('/:id', loadTagAccess, requireWorkspaceRole('editor'), tagController.remove);

export default router;
