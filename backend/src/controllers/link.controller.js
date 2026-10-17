import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as linkService from '../services/link.service.js';

export const create = asyncHandler(async (req, res) => {
  const link = await linkService.createLink({
    workspaceId: req.workspace.id,
    ownerId: req.user.id,
    input: req.body,
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Link created successfully',
    data: { link: linkService.serializeLink(link) },
  });
});

export const list = asyncHandler(async (req, res) => {
  const result = await linkService.listLinks({
    workspaceId: req.workspace.id,
    filter: req.query.filter,
    search: req.query.search,
    campaignId: req.query.campaignId,
    tagId: req.query.tagId,
    page: req.query.page,
    limit: req.query.limit,
  });

  return successResponse(res, {
    message: 'Links retrieved',
    data: result,
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const link = await linkService.getLinkById(req.link.id);

  return successResponse(res, {
    message: 'Link retrieved',
    data: { link: linkService.serializeLink(link), role: req.workspaceRole },
  });
});

export const update = asyncHandler(async (req, res) => {
  const link = await linkService.updateLink(req.link, req.body);

  return successResponse(res, {
    message: 'Link updated successfully',
    data: { link: linkService.serializeLink(link) },
  });
});

export const remove = asyncHandler(async (req, res) => {
  await linkService.deleteLink(req.link);

  return successResponse(res, {
    message: 'Link deleted successfully',
    data: null,
  });
});
