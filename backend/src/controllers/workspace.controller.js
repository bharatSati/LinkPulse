import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as workspaceService from '../services/workspace.service.js';

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
    data: { workspace, role: req.workspaceRole },
  });
});

export const addMember = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.addWorkspaceMember({
    workspaceId: req.workspace.id,
    userId: req.validated.userId,
    role: req.validated.role,
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
  });

  return successResponse(res, {
    message: 'Member removed successfully',
    data: { workspace },
  });
});
