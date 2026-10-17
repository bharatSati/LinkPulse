import api from './api.js';

export async function getInsights({ workspaceId, from, to, refresh } = {}) {
  const params = { workspaceId, from, to };
  if (refresh) params.refresh = 'true';
  const { data } = await api.get('/ai/insights', { params });
  return data.data;
}

export async function getRecommendations({ workspaceId, from, to, refresh } = {}) {
  const payload = { workspaceId, from, to };
  if (refresh) payload.refresh = true;
  const { data } = await api.post('/ai/recommendations', payload);
  return data.data;
}

export async function ask({ workspaceId, question, from, to } = {}) {
  const { data } = await api.post('/ai/ask', { workspaceId, question, from, to });
  return data.data;
}

export async function getHistory({ workspaceId, kind, limit } = {}) {
  const params = { workspaceId };
  if (kind) params.kind = kind;
  if (limit) params.limit = limit;
  const { data } = await api.get('/ai/history', { params });
  return data.data;
}
