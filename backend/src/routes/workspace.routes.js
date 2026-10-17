import { Router } from 'express';
import * as workspaceController from '../controllers/workspace.controller.js';
import * as abuseController from '../controllers/abuse.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  loadWorkspace,
  requireWorkspaceRole,
  requireWorkspacePermission,
} from '../middleware/workspace.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { WORKSPACE_ROLES } from '../utils/roles.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { validObjectId } from '../middleware/objectId.middleware.js';

const router = Router();

router.use(authenticate);

const nameRule = { required: true, type: 'string', minLength: 2, maxLength: 100 };

router.post('/', validateBody({ name: nameRule }), workspaceController.create);

router.get('/', workspaceController.listMine);

router.get('/:workspaceId', loadWorkspace, workspaceController.getOne);

router.patch(
  '/:workspaceId',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.WORKSPACE_UPDATE),
  validateBody({ name: nameRule }),
  workspaceController.update
);

router.delete(
  '/:workspaceId',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.WORKSPACE_DELETE),
  workspaceController.remove
);

router.get(
  '/:workspaceId/overview',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.WORKSPACE_VIEW),
  workspaceController.overview
);

router.get(
  '/:workspaceId/members',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.MEMBERS_VIEW),
  workspaceController.listMembers
);

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

router.post(
  '/:workspaceId/transfer',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.OWNERSHIP_TRANSFER),
  validateBody({
    userId: { required: true, type: 'string', objectId: true },
  }),
  workspaceController.transferOwnership
);

router.post(
  '/:workspaceId/leave',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.WORKSPACE_LEAVE),
  workspaceController.leave
);

router.get(
  '/:workspaceId/invitations',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.MEMBERS_INVITE),
  workspaceController.listInvitations
);

router.post(
  '/:workspaceId/invitations',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.MEMBERS_INVITE),
  validateBody({
    email: { required: true, type: 'email', maxLength: 160 },
    role: { required: true, type: 'string', enum: WORKSPACE_ROLES },
  }),
  workspaceController.createInvitation
);

router.post(
  '/:workspaceId/invitations/:invitationId/resend',
  validObjectId('invitationId'),
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.MEMBERS_INVITE),
  workspaceController.resendInvitation
);

router.delete(
  '/:workspaceId/invitations/:invitationId',
  validObjectId('invitationId'),
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.MEMBERS_INVITE),
  workspaceController.revokeInvitation
);

router.get(
  '/:workspaceId/audit',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.AUDIT_VIEW),
  workspaceController.listAudit
);

/* ----------------------------- Abuse console ----------------------------- */

router.get(
  '/:workspaceId/abuse/summary',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.ABUSE_MANAGE),
  abuseController.summary
);

router.get(
  '/:workspaceId/abuse/events',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.ABUSE_MANAGE),
  abuseController.listEvents
);

router.patch(
  '/:workspaceId/abuse/events/:eventId',
  validObjectId('eventId'),
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.ABUSE_MANAGE),
  validateBody({
    status: { required: true, type: 'string', enum: ['reviewing', 'resolved', 'dismissed'] },
    note: { type: 'string', maxLength: 500 },
  }),
  abuseController.updateEvent
);

router.get(
  '/:workspaceId/abuse/reports',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.ABUSE_MANAGE),
  abuseController.listReports
);

router.get(
  '/:workspaceId/abuse/reports/:reportId',
  validObjectId('reportId'),
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.ABUSE_MANAGE),
  abuseController.getReport
);

router.patch(
  '/:workspaceId/abuse/reports/:reportId',
  validObjectId('reportId'),
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.ABUSE_MANAGE),
  validateBody({
    status: { required: true, type: 'string', enum: ['reviewing', 'resolved', 'dismissed'] },
    reviewNotes: { type: 'string', maxLength: 1000 },
  }),
  abuseController.reviewReport
);

router.get(
  '/:workspaceId/abuse/links',
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.ABUSE_MANAGE),
  abuseController.listSuspiciousLinks
);

router.get(
  '/:workspaceId/abuse/links/:linkId',
  validObjectId('linkId'),
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.ABUSE_MANAGE),
  abuseController.inspectLink
);

router.post(
  '/:workspaceId/abuse/links/:linkId/disable',
  validObjectId('linkId'),
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.ABUSE_MANAGE),
  abuseController.disableLink
);

router.post(
  '/:workspaceId/abuse/links/:linkId/reactivate',
  validObjectId('linkId'),
  loadWorkspace,
  requireWorkspacePermission(PERMISSIONS.ABUSE_MANAGE),
  abuseController.reactivateLink
);

export default router;
