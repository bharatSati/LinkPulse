import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as abuseService from '../services/abuse.service.js';
import * as reportService from '../services/report.service.js';

export const submitReport = asyncHandler(async (req, res) => {
  const data = await reportService.submitReport({
    code: req.validated.code,
    reason: req.validated.reason,
    description: req.validated.description,
    user: req.user || null,
    req,
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Report submitted. Thank you for helping keep links safe.',
    data,
  });
});

export const summary = asyncHandler(async (req, res) => {
  const data = await abuseService.getAbuseSummary({ workspaceId: req.workspace.id });
  return successResponse(res, { message: 'Abuse summary retrieved', data });
});

export const listEvents = asyncHandler(async (req, res) => {
  const data = await abuseService.listEvents({
    workspaceId: req.workspace.id,
    status: req.query.status,
    severity: req.query.severity,
    type: req.query.type,
    page: req.query.page,
    limit: req.query.limit,
  });

  return successResponse(res, { message: 'Security events retrieved', data });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await abuseService.updateEventStatus({
    workspaceId: req.workspace.id,
    eventId: req.params.eventId,
    actor: req.user.id,
    status: req.validated.status,
    note: req.validated.note,
  });

  return successResponse(res, { message: 'Security event updated', data: { event } });
});

export const listReports = asyncHandler(async (req, res) => {
  const data = await reportService.listReports({
    workspaceId: req.workspace.id,
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
  });

  return successResponse(res, { message: 'Reports retrieved', data });
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getReport({
    workspaceId: req.workspace.id,
    reportId: req.params.reportId,
  });

  return successResponse(res, { message: 'Report retrieved', data: { report } });
});

export const reviewReport = asyncHandler(async (req, res) => {
  const report = await reportService.reviewReport({
    workspaceId: req.workspace.id,
    reportId: req.params.reportId,
    actor: req.user.id,
    status: req.validated.status,
    reviewNotes: req.validated.reviewNotes,
  });

  return successResponse(res, { message: 'Report reviewed', data: { report } });
});

export const listSuspiciousLinks = asyncHandler(async (req, res) => {
  const data = await abuseService.listSuspiciousLinks({
    workspaceId: req.workspace.id,
    minSeverity: req.query.minSeverity,
    page: req.query.page,
    limit: req.query.limit,
  });

  return successResponse(res, { message: 'Suspicious links retrieved', data });
});

export const inspectLink = asyncHandler(async (req, res) => {
  const data = await abuseService.inspectLink({
    workspaceId: req.workspace.id,
    linkId: req.params.linkId,
  });

  return successResponse(res, { message: 'Link inspection retrieved', data });
});

export const disableLink = asyncHandler(async (req, res) => {
  const data = await abuseService.disableLink({
    workspaceId: req.workspace.id,
    linkId: req.params.linkId,
    actor: req.user.id,
    reason: req.body?.reason,
  });

  return successResponse(res, { message: 'Link disabled', data });
});

export const reactivateLink = asyncHandler(async (req, res) => {
  const data = await abuseService.reactivateLink({
    workspaceId: req.workspace.id,
    linkId: req.params.linkId,
    actor: req.user.id,
    reason: req.body?.reason,
  });

  return successResponse(res, { message: 'Link reactivated', data });
});
