import api from './api.js';

export async function submitReport({ code, reason, description }) {
  const { data } = await api.post('/abuse/reports', { code, reason, description });
  return data.data;
}

export async function getSummary(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/abuse/summary`);
  return data.data;
}

export async function listEvents(workspaceId, { status, severity, type, page, limit } = {}) {
  const params = {};
  if (status) params.status = status;
  if (severity) params.severity = severity;
  if (type) params.type = type;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await api.get(`/workspaces/${workspaceId}/abuse/events`, { params });
  return data.data;
}

export async function updateEvent(workspaceId, eventId, payload) {
  const { data } = await api.patch(`/workspaces/${workspaceId}/abuse/events/${eventId}`, payload);
  return data.data.event;
}

export async function listReports(workspaceId, { status, page, limit } = {}) {
  const params = {};
  if (status) params.status = status;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await api.get(`/workspaces/${workspaceId}/abuse/reports`, { params });
  return data.data;
}

export async function getReport(workspaceId, reportId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/abuse/reports/${reportId}`);
  return data.data.report;
}

export async function reviewReport(workspaceId, reportId, payload) {
  const { data } = await api.patch(
    `/workspaces/${workspaceId}/abuse/reports/${reportId}`,
    payload
  );
  return data.data.report;
}

export async function listSuspiciousLinks(workspaceId, { minSeverity, page, limit } = {}) {
  const params = {};
  if (minSeverity) params.minSeverity = minSeverity;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await api.get(`/workspaces/${workspaceId}/abuse/links`, { params });
  return data.data;
}

export async function inspectLink(workspaceId, linkId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/abuse/links/${linkId}`);
  return data.data;
}

export async function disableLink(workspaceId, linkId, reason) {
  const { data } = await api.post(`/workspaces/${workspaceId}/abuse/links/${linkId}/disable`, {
    reason,
  });
  return data.data;
}

export async function reactivateLink(workspaceId, linkId, reason) {
  const { data } = await api.post(
    `/workspaces/${workspaceId}/abuse/links/${linkId}/reactivate`,
    { reason }
  );
  return data.data;
}
