import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import Campaign from '../models/Campaign.js';
import Workspace from '../models/Workspace.js';
import { isValidObjectId } from '../utils/validators.js';

export const loadCampaignAccess = asyncHandler(async (req, res, next) => {
  const id = req.params.id || req.params.campaignId;

  if (!isValidObjectId(id)) {
    throw ApiError.badRequest('Invalid campaign id');
  }

  const campaign = await Campaign.findById(id);
  if (!campaign) {
    throw ApiError.notFound('Campaign not found');
  }

  const workspace = await Workspace.findById(campaign.workspace);
  if (!workspace) {
    throw ApiError.notFound('Workspace not found');
  }

  const isOwner = workspace.owner.toString() === req.user.id;
  const membership = workspace.members.find(
    (member) => member.user.toString() === req.user.id
  );

  if (!isOwner && !membership) {
    throw ApiError.forbidden('You do not have access to this campaign');
  }

  req.campaign = campaign;
  req.workspace = workspace;
  req.workspaceRole = isOwner ? 'owner' : membership.role;
  next();
});
