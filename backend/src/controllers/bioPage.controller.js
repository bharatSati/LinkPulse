import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as bioPageService from '../services/bioPage.service.js';

export const create = asyncHandler(async (req, res) => {
  const page = await bioPageService.createBioPage({
    workspaceId: req.workspace.id,
    ownerId: req.user.id,
    input: req.body,
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Bio page created successfully',
    data: { bioPage: bioPageService.serializeBioPage(page) },
  });
});

export const list = asyncHandler(async (req, res) => {
  const result = await bioPageService.listBioPages({
    workspaceId: req.workspace.id,
    search: req.query.search,
    page: req.query.page,
    limit: req.query.limit,
  });

  return successResponse(res, { message: 'Bio pages retrieved', data: result });
});

export const checkUsername = asyncHandler(async (req, res) => {
  const result = await bioPageService.checkUsernameAvailability({
    username: req.query.username,
    excludeId: req.query.excludeId,
  });

  return successResponse(res, {
    message: result.available ? 'Username is available' : 'Username is unavailable',
    data: result,
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const page = await bioPageService.getBioPageById(req.bioPage.id);

  return successResponse(res, {
    message: 'Bio page retrieved',
    data: {
      bioPage: bioPageService.serializeBioPage(page),
      role: req.workspaceRole,
    },
  });
});

export const update = asyncHandler(async (req, res) => {
  const page = await bioPageService.updateBioPage(req.bioPage, req.body);

  return successResponse(res, {
    message: 'Bio page updated successfully',
    data: { bioPage: bioPageService.serializeBioPage(page) },
  });
});

export const publish = asyncHandler(async (req, res) => {
  const page = await bioPageService.setBioPagePublished(req.bioPage, req.body?.isPublished);

  return successResponse(res, {
    message: page.isPublished ? 'Bio page published' : 'Bio page unpublished',
    data: { bioPage: bioPageService.serializeBioPage(page) },
  });
});

export const remove = asyncHandler(async (req, res) => {
  await bioPageService.deleteBioPage(req.bioPage);

  return successResponse(res, {
    message: 'Bio page deleted successfully',
    data: null,
  });
});
