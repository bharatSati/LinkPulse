import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Tag from '../models/Tag.js';
import Workspace from '../models/Workspace.js';
import { isValidObjectId } from '../utils/validators.js';

export const loadTagAccess = asyncHandler(async (req, res, next) => {
  const id = req.params.id || req.params.tagId;

  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid tag id');
  }

  const tag = await Tag.findById(id);
  if (!tag) {
    throw ApiError.notFound('Tag not found');
  }

  const workspace = await Workspace.findById(tag.workspace);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const isOwner = workspace.owner.toString() === req.user.id;
  const membership = workspace.members.find(
    (member) => member.user.toString() === req.user.id
  );

  if (!isOwner && !membership) {
    throw ApiError.forbidden('You do not have access to this tag');
  }

  req.tag = tag;
  req.workspace = workspace;
  req.workspaceRole = isOwner ? 'owner' : membership.role;
  next();
});
