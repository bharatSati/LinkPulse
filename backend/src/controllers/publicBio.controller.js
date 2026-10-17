import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as bioPageService from '../services/bioPage.service.js';

export const getByUsername = asyncHandler(async (req, res) => {
  const bioPage = await bioPageService.getPublicBioPage(req.params.username);

  return successResponse(res, {
    message: 'Bio page retrieved',
    data: { bioPage },
  });
});
