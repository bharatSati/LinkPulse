import api from './api.js';

export async function listWorkspaces() {
  const { data } = await api.get('/workspaces');
  return data.data.workspaces;
}

export async function createWorkspace(payload) {
  const { data } = await api.post('/workspaces', payload);
  return data.data.workspace;
}

export async function getWorkspace(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}`);
  return data.data;
}

export async function updateWorkspace(workspaceId, payload) {
  const { data } = await api.patch(`/workspaces/${workspaceId}`, payload);
  return data.data.workspace;
}

export async function deleteWorkspace(workspaceId, confirmName) {
  const { data } = await api.delete(`/workspaces/${workspaceId}`, {
    data: { confirmName },
  });
  return data.data;
}

export async function listMembers(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/members`);
  return data.data.members;
}

export async function updateMemberRole(workspaceId, userId, role) {
  const { data } = await api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
  return data.data.workspace;
}

export async function removeMember(workspaceId, userId) {
  const { data } = await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
  return data.data.workspace;
}

export async function transferOwnership(workspaceId, userId) {
  const { data } = await api.post(`/workspaces/${workspaceId}/transfer`, { userId });
  return data.data.workspace;
}

export async function leaveWorkspace(workspaceId) {
  const { data } = await api.post(`/workspaces/${workspaceId}/leave`);
  return data.data;
}

export async function getOverview(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/overview`);
  return data.data;
}

export async function listAuditLogs(workspaceId, limit) {
  const { data } = await api.get(`/workspaces/${workspaceId}/audit`, {
    params: limit ? { limit } : undefined,
  });
  return data.data.activity;
}

export async function listInvitations(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/invitations`);
  return data.data.invitations;
}

export async function createInvitation(workspaceId, payload) {
  const { data } = await api.post(`/workspaces/${workspaceId}/invitations`, payload);
  return data.data;
}

export async function resendInvitation(workspaceId, invitationId) {
  const { data } = await api.post(
    `/workspaces/${workspaceId}/invitations/${invitationId}/resend`
  );
  return data.data;
}

export async function revokeInvitation(workspaceId, invitationId) {
  const { data } = await api.delete(
    `/workspaces/${workspaceId}/invitations/${invitationId}`
  );
  return data.data.invitation;
}
