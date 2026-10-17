import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as analyticsService from '../services/analytics.service.js';
import * as aiService from '../services/ai.service.js';

function resolveAiRange(req) {
  const source = { ...(req.query || {}), ...(req.body || {}) };
  return analyticsService.resolveRange(source);
}

function wantsRefresh(req) {
  return req.query?.refresh === 'true' || req.body?.refresh === true;
}

export const insights = asyncHandler(async (req, res) => {
  const range = resolveAiRange(req);
  const data = await aiService.getInsights({
    workspaceId: req.workspace.id,
    range,
    refresh: wantsRefresh(req),
  });

  return successResponse(res, {
    message: data.available
      ? 'AI insights retrieved'
      : 'Insights retrieved with limited AI availability',
    data,
  });
});

export const recommendations = asyncHandler(async (req, res) => {
  const range = resolveAiRange(req);
  const data = await aiService.getRecommendations({
    workspaceId: req.workspace.id,
    range,
    refresh: wantsRefresh(req),
  });

  return successResponse(res, {
    message: data.available
      ? 'AI recommendations generated'
      : 'Recommendations retrieved with limited AI availability',
    data,
  });
});

export const ask = asyncHandler(async (req, res) => {
  const range = resolveAiRange(req);
  const question = aiService.validateQuestion(req.body?.question);

  const data = await aiService.ask({
    workspaceId: req.workspace.id,
    range,
    question,
  });

  return successResponse(res, {
    message: data.available ? 'Answer generated' : 'Answer unavailable',
    data,
  });
});

export const history = asyncHandler(async (req, res) => {
  const data = await aiService.getHistory({
    workspaceId: req.workspace.id,
    kind: req.query?.kind,
    limit: req.query?.limit,
  });

  return successResponse(res, { message: 'AI insight history retrieved', data });
});
