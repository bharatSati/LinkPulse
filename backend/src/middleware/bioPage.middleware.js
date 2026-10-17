import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import BioPage from '../models/BioPage.js';
import Workspace from '../models/Workspace.js';
import { isValidObjectId } from '../utils/validators.js';

export const loadBioPageAccess = asyncHandler(async (req, res, next) => {
  const id = req.params.id || req.params.bioPageId;

  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid bio page id');
  }

  const bioPage = await BioPage.findById(id);
  if (!bioPage) {
    throw ApiError.notFound('Bio page not found');
  }

  const workspace = await Workspace.findById(bioPage.workspace);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const isOwner = workspace.owner.toString() === req.user.id;
  const membership = workspace.members.find(
    (member) => member.user.toString() === req.user.id
  );

  if (!isOwner && !membership) {
    throw ApiError.forbidden('You do not have access to this bio page');
  }

  req.bioPage = bioPage;
  req.workspace = workspace;
  req.workspaceRole = isOwner ? 'owner' : membership.role;
  next();
});
