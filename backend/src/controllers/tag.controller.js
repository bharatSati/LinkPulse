import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as tagService from '../services/tag.service.js';

export const create = asyncHandler(async (req, res) => {
  const tag = await tagService.createTag({
    workspaceId: req.workspace.id,
    userId: req.user.id,
    input: req.body,
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Tag created successfully',
    data: { tag: tagService.serializeTag(tag) },
  });
});

export const list = asyncHandler(async (req, res) => {
  const result = await tagService.listTags({
    workspaceId: req.workspace.id,
    search: req.query.search,
  });

  return successResponse(res, { message: 'Tags retrieved', data: result });
});

export const update = asyncHandler(async (req, res) => {
  const tag = await tagService.updateTag(req.tag, req.body);

  return successResponse(res, {
    message: 'Tag updated successfully',
    data: { tag: tagService.serializeTag(tag) },
  });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await tagService.deleteTag(req.tag);

  return successResponse(res, {
    message: 'Tag deleted successfully',
    data: result,
  });
});
