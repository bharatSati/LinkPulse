import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import ImportJob from '../models/ImportJob.js';
import Workspace from '../models/Workspace.js';
import { isValidObjectId } from '../utils/validators.js';

export const loadImportAccess = asyncHandler(async (req, res, next) => {
  const { importId } = req.params;

  if (!isValidObjectId(importId)) {
    throw ApiError.badRequest('Invalid import id');
  }

  const job = await ImportJob.findById(importId);
  if (!job) {
    throw ApiError.notFound('Import not found');
  }

  const workspace = await Workspace.findById(job.workspace);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const isOwner = workspace.owner.toString() === req.user.id;
  const membership = workspace.members.find(
    (member) => member.user.toString() === req.user.id
  );

  if (!isOwner && !membership) {
    throw ApiError.forbidden('You do not have access to this import');
  }

  req.importJob = job;
  req.workspace = workspace;
  req.workspaceRole = isOwner ? 'owner' : membership.role;
  next();
});
