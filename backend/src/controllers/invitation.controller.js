import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as invitationService from '../services/invitation.service.js';

export const preview = asyncHandler(async (req, res) => {
  const data = await invitationService.previewInvitation(req.params.token);

  return successResponse(res, {
    message: 'Invitation retrieved',
    data,
  });
});

export const accept = asyncHandler(async (req, res) => {
  const { workspace, role, alreadyMember } = await invitationService.acceptInvitation({
    token: req.validated.token,
    user: req.user,
  });

  return successResponse(res, {
    message: alreadyMember
      ? 'You are already a member of this workspace'
      : 'Invitation accepted successfully',
    data: {
      workspace: { id: workspace.id, name: workspace.name },
      role,
      alreadyMember,
    },
  });
});

export const reject = asyncHandler(async (req, res) => {
  const data = await invitationService.rejectInvitation({
    token: req.validated.token,
    user: req.user,
  });

  return successResponse(res, {
    message: 'Invitation declined',
    data,
  });
});
