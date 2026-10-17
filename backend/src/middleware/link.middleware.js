import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Link from '../models/Link.js';
import Workspace from '../models/Workspace.js';
import { isValidObjectId } from '../utils/validators.js';

export const loadLinkAccess = asyncHandler(async (req, res, next) => {
  const id = req.params.id || req.params.linkId;

  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid link id');
  }

  const link = await Link.findById(id);
  if (!link) {
    throw ApiError.notFound('Link not found');
  }

  const workspace = await Workspace.findById(link.workspace);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const isOwner = workspace.owner.toString() === req.user.id;
  const membership = workspace.members.find(
    (member) => member.user.toString() === req.user.id
  );

  if (!isOwner && !membership) {
    throw ApiError.forbidden('You do not have access to this link');
  }

  req.link = link;
  req.workspace = workspace;
  req.workspaceRole = isOwner ? 'owner' : membership.role;
  next();
});
