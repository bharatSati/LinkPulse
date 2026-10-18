import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as workspaceService from '../services/workspace.service.js';
import * as invitationService from '../services/invitation.service.js';
import * as auditService from '../services/audit.service.js';
import env from '../config/env.js';
import { permissionsForRole } from '../utils/permissions.js';

function emailDeliveryAvailable() {
  return env.emailDeliveryConfigured;
}

export const create = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.createWorkspace({
    name: req.validated.name,
    ownerId: req.user.id,
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Workspace created successfully',
    data: { workspace },
  });
});

export const listMine = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.listWorkspacesForUser(req.user.id);

  return successResponse(res, {
    message: 'Workspaces retrieved',
    data: { workspaces },
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getWorkspaceById(req.workspace.id);

  return successResponse(res, {
    message: 'Workspace retrieved',
    data: {
      workspace,
      role: req.workspaceRole,
      permissions: permissionsForRole(req.workspaceRole),
    },
  });
});

export const update = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateWorkspace({
    workspaceId: req.workspace.id,
    name: req.validated.name,
    actor: req.user.id,
  });

  return successResponse(res, {
    message: 'Workspace updated successfully',
    data: { workspace },
  });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await workspaceService.deleteWorkspace({
    workspaceId: req.workspace.id,
    actor: req.user.id,
    confirmName: req.body?.confirmName,
  });

  return successResponse(res, {
    message: 'Workspace deleted successfully',
    data: result,
  });
});

export const listMembers = asyncHandler(async (req, res) => {
  const members = await workspaceService.listWorkspaceMembers({
    workspaceId: req.workspace.id,
  });

  return successResponse(res, {
    message: 'Workspace members retrieved',
    data: { members },
  });
});

export const addMember = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.addWorkspaceMember({
    workspaceId: req.workspace.id,
    userId: req.validated.userId,
    role: req.validated.role,
    actor: req.user.id,
    actorRole: req.workspaceRole,
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Member added successfully',
    data: { workspace },
  });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateWorkspaceMemberRole({
    workspaceId: req.workspace.id,
    userId: req.params.userId,
    role: req.validated.role,
    actor: req.user.id,
    actorRole: req.workspaceRole,
  });

  return successResponse(res, {
    message: 'Member role updated successfully',
    data: { workspace },
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.removeWorkspaceMember({
    workspaceId: req.workspace.id,
    userId: req.params.userId,
    actor: req.user.id,
    actorRole: req.workspaceRole,
  });

  return successResponse(res, {
    message: 'Member removed successfully',
    data: { workspace },
  });
});

export const transferOwnership = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.transferOwnership({
    workspaceId: req.workspace.id,
    targetUserId: req.validated.userId,
    actor: req.user.id,
  });

  return successResponse(res, {
    message: 'Workspace ownership transferred successfully',
    data: { workspace },
  });
});

export const leave = asyncHandler(async (req, res) => {
  await workspaceService.leaveWorkspace({
    workspaceId: req.workspace.id,
    userId: req.user.id,
  });

  return successResponse(res, {
    message: 'You have left the workspace',
    data: { workspaceId: req.workspace.id },
  });
});

export const overview = asyncHandler(async (req, res) => {
  const data = await workspaceService.getWorkspaceOverview({
    workspaceId: req.workspace.id,
  });

  if (req.workspaceRole === 'owner' || req.workspaceRole === 'admin') {
    data.activity = await auditService.listAuditLogs({
      workspaceId: req.workspace.id,
      limit: 15,
    });
  }

  return successResponse(res, {
    message: 'Workspace overview retrieved',
    data,
  });
});

export const listInvitations = asyncHandler(async (req, res) => {
  const invitations = await invitationService.listInvitations({
    workspaceId: req.workspace.id,
  });

  return successResponse(res, {
    message: 'Invitations retrieved',
    data: { invitations },
  });
});

export const createInvitation = asyncHandler(async (req, res) => {
  if (!emailDeliveryAvailable() && env.isProduction) {
    throw new ApiError(
      503,
      'Email delivery is not configured, so invitations cannot be sent right now.'
    );
  }

  const { invitation, inviteUrl, emailSent } = await invitationService.createInvitation({
    workspace: req.workspace,
    email: req.validated.email,
    role: req.validated.role,
    actor: req.user.id,
    actorRole: req.workspaceRole,
  });

  const data = { invitation, emailSent };
  if (!emailSent) {
    data.inviteUrl = inviteUrl;
    data.emailConfigured = emailDeliveryAvailable();
  }

  return successResponse(res, {
    statusCode: 201,
    message: emailSent
      ? 'Invitation sent successfully'
      : emailDeliveryAvailable()
        ? 'Invitation created, but the email could not be sent. Share the invite link manually.'
        : 'Invitation created. Email delivery is not configured, so share the invite link manually.',
    data,
  });
});

export const resendInvitation = asyncHandler(async (req, res) => {
  if (!emailDeliveryAvailable() && env.isProduction) {
    throw new ApiError(503, 'Email delivery is not configured, so invitations cannot be sent.');
  }

  const { invitation, inviteUrl, emailSent } = await invitationService.resendInvitation({
    workspaceId: req.workspace.id,
    invitationId: req.params.invitationId,
    actor: req.user.id,
  });

  const data = { invitation, emailSent };
  if (!emailSent) {
    data.inviteUrl = inviteUrl;
    data.emailConfigured = emailDeliveryAvailable();
  }

  return successResponse(res, {
    message: emailSent
      ? 'Invitation resent successfully'
      : emailDeliveryAvailable()
        ? 'Invitation refreshed, but the email could not be sent. Share the invite link manually.'
        : 'Invitation refreshed. Email delivery is not configured, so share the invite link manually.',
    data,
  });
});

export const revokeInvitation = asyncHandler(async (req, res) => {
  const invitation = await invitationService.revokeInvitation({
    workspaceId: req.workspace.id,
    invitationId: req.params.invitationId,
    actor: req.user.id,
  });

  return successResponse(res, {
    message: 'Invitation revoked',
    data: { invitation },
  });
});

export const listAudit = asyncHandler(async (req, res) => {
  const logs = await auditService.listAuditLogs({
    workspaceId: req.workspace.id,
    limit: req.query.limit,
  });

  return successResponse(res, {
    message: 'Activity retrieved',
    data: { activity: logs },
  });
});
