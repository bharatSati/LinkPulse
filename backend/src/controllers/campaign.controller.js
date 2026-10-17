import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as campaignService from '../services/campaign.service.js';
import * as analyticsService from '../services/analytics.service.js';

export const create = asyncHandler(async (req, res) => {
  const campaign = await campaignService.createCampaign({
    workspaceId: req.workspace.id,
    ownerId: req.user.id,
    input: req.body,
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Campaign created successfully',
    data: { campaign: campaignService.serializeCampaign(campaign) },
  });
});

export const list = asyncHandler(async (req, res) => {
  const result = await campaignService.listCampaigns({
    workspaceId: req.workspace.id,
    search: req.query.search,
    status: req.query.status,
    from: req.query.from,
    to: req.query.to,
    sort: req.query.sort,
    page: req.query.page,
    limit: req.query.limit,
  });

  return successResponse(res, { message: 'Campaigns retrieved', data: result });
});

export const getOne = asyncHandler(async (req, res) => {
  const campaign = await campaignService.describeCampaign(req.campaign);

  return successResponse(res, {
    message: 'Campaign retrieved',
    data: { campaign, role: req.workspaceRole },
  });
});

export const update = asyncHandler(async (req, res) => {
  const campaign = await campaignService.updateCampaign(req.campaign, req.body);
  const detailed = await campaignService.describeCampaign(campaign);

  return successResponse(res, {
    message: 'Campaign updated successfully',
    data: { campaign: detailed },
  });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await campaignService.deleteCampaign(req.campaign);

  return successResponse(res, {
    message: 'Campaign deleted successfully',
    data: result,
  });
});

export const listLinks = asyncHandler(async (req, res) => {
  const result = await campaignService.getCampaignLinks({
    campaign: req.campaign,
    search: req.query.search,
    filter: req.query.filter,
    page: req.query.page,
    limit: req.query.limit,
  });

  return successResponse(res, { message: 'Campaign links retrieved', data: result });
});

export const analytics = asyncHandler(async (req, res) => {
  const range = analyticsService.resolveRange(req.query);
  const data = await campaignService.getCampaignAnalytics({ campaign: req.campaign, range });

  return successResponse(res, { message: 'Campaign analytics retrieved', data });
});
