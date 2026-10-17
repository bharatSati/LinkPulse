import api from './api.js';

export async function listTags({ workspaceId, search } = {}) {
  const params = { workspaceId };
  if (search) params.search = search;

  const { data } = await api.get('/tags', { params });
  return data.data.tags;
}

export async function createTag(payload) {
  const { data } = await api.post('/tags', payload);
  return data.data.tag;
}

export async function updateTag(id, payload) {
  const { data } = await api.patch(`/tags/${id}`, payload);
  return data.data.tag;
}

export async function deleteTag(id) {
  const { data } = await api.delete(`/tags/${id}`);
  return data.data;
}
