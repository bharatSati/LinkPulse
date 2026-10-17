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
