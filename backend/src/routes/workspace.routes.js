import { Router } from 'express';
import * as workspaceController from '../controllers/workspace.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loadWorkspace, requireWorkspaceRole } from '../middleware/workspace.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { WORKSPACE_ROLES } from '../utils/roles.js';
import { validObjectId } from '../middleware/objectId.middleware.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validateBody({
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  }),
  workspaceController.create
);

router.get('/', workspaceController.listMine);

router.get('/:workspaceId', loadWorkspace, workspaceController.getOne);

router.post(
  '/:workspaceId/members',
  loadWorkspace,
  requireWorkspaceRole('admin'),
  validateBody({
    userId: { required: true, type: 'string', objectId: true },
    role: { required: true, type: 'string', enum: WORKSPACE_ROLES },
  }),
  workspaceController.addMember
);

router.patch(
  '/:workspaceId/members/:userId',
  validObjectId('userId'),
  loadWorkspace,
  requireWorkspaceRole('admin'),
  validateBody({
    role: { required: true, type: 'string', enum: WORKSPACE_ROLES },
  }),
  workspaceController.updateMemberRole
);

router.delete(
  '/:workspaceId/members/:userId',
  validObjectId('userId'),
  loadWorkspace,
  requireWorkspaceRole('admin'),
  workspaceController.removeMember
);

export default router;
