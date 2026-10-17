import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { isValidObjectId } from '../utils/validators.js';
import * as analyticsService from '../services/analytics.service.js';

function resolveScope(req) {
  const range = analyticsService.resolveRange(req.query);

  let linkId = null;
  if (req.query.linkId) {
    if (!isValidObjectId(req.query.linkId)) {
      throw ApiError.badRequest('Invalid linkId filter');
    }
    linkId = req.query.linkId;
  }

  return { range, linkId };
}

export const overview = asyncHandler(async (req, res) => {
  const { range, linkId } = resolveScope(req);

  const data = await analyticsService.getOverview({
    workspaceId: req.workspace.id,
    linkId,
    range,
  });

  return successResponse(res, { message: 'Analytics overview retrieved', data });
});

export const clicksOverTime = asyncHandler(async (req, res) => {
  const { range, linkId } = resolveScope(req);

  const data = await analyticsService.getClicksOverTime({
    workspaceId: req.workspace.id,
    linkId,
    range,
    interval: req.query.interval,
  });

  return successResponse(res, { message: 'Clicks over time retrieved', data });
});

export const topLinks = asyncHandler(async (req, res) => {
  const { range } = resolveScope(req);

  const data = await analyticsService.getTopLinks({
    workspaceId: req.workspace.id,
    range,
    limit: req.query.limit,
  });

  return successResponse(res, { message: 'Top links retrieved', data: { links: data } });
});

export const referrers = asyncHandler(async (req, res) => {
  const { range, linkId } = resolveScope(req);

  const data = await analyticsService.getReferrers({
    workspaceId: req.workspace.id,
    linkId,
    range,
    limit: req.query.limit,
  });

  return successResponse(res, { message: 'Referrers retrieved', data });
});

export const devices = asyncHandler(async (req, res) => {
  const { range, linkId } = resolveScope(req);

  const data = await analyticsService.getDevices({
    workspaceId: req.workspace.id,
    linkId,
    range,
  });

  return successResponse(res, { message: 'Device distribution retrieved', data });
});

export const browsers = asyncHandler(async (req, res) => {
  const { range, linkId } = resolveScope(req);

  const data = await analyticsService.getBrowsers({
    workspaceId: req.workspace.id,
    linkId,
    range,
  });

  return successResponse(res, { message: 'Browser distribution retrieved', data });
});

export const locations = asyncHandler(async (req, res) => {
  const { range, linkId } = resolveScope(req);

  const data = await analyticsService.getLocations({
    workspaceId: req.workspace.id,
    linkId,
    range,
    limit: req.query.limit,
  });

  return successResponse(res, { message: 'Location distribution retrieved', data });
});

export const linkAnalytics = asyncHandler(async (req, res) => {
  const range = analyticsService.resolveRange(req.query);

  const data = await analyticsService.getLinkAnalytics({ link: req.link, range });

  return successResponse(res, {
    message: 'Link analytics retrieved',
    data: {
      link: {
        id: req.link.id,
        title: req.link.title,
        shortCode: req.link.shortCode,
        customAlias: req.link.customAlias,
        originalUrl: req.link.originalUrl,
        status: req.link.status,
      },
      ...data,
    },
  });
});
