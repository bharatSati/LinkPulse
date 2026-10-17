import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Workspace from '../models/Workspace.js';
import { hasWorkspaceRole } from '../utils/roles.js';

export const loadWorkspace = asyncHandler(async (req, res, next) => {
  const workspaceId =
    req.params.workspaceId || req.body?.workspaceId || req.query?.workspaceId;

  if (!workspaceId) {
    throw ApiError.badRequest('Workspace id is required');
  }

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const isOwner = workspace.owner.toString() === req.user.id;
  const membership = workspace.members.find(
    (member) => member.user.toString() === req.user.id
  );

  if (!isOwner && !membership) {
    throw ApiError.forbidden('You do not have access to this workspace');
  }

  req.workspace = workspace;
  req.workspaceRole = isOwner ? 'owner' : membership.role;
  next();
});

export const requireWorkspaceRole = (requiredRole) => (req, res, next) => {
  if (!req.workspaceRole) {
    return next(ApiError.forbidden('Workspace role could not be determined'));
  }

  if (!hasWorkspaceRole(req.workspaceRole, requiredRole)) {
    return next(
      ApiError.forbidden(`This action requires the "${requiredRole}" role or higher`)
    );
  }

  return next();
};
