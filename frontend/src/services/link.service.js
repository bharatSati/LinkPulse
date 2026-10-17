import api from './api.js';

export async function listLinks({ workspaceId, search, filter, page, limit }) {
  const params = { workspaceId };
  if (search) params.search = search;
  if (filter && filter !== 'all') params.filter = filter;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await api.get('/links', { params });
  return data.data;
}

export async function createLink(payload) {
  const { data } = await api.post('/links', payload);
  return data.data.link;
}

export async function getLink(id) {
  const { data } = await api.get(`/links/${id}`);
  return data.data.link;
}

export async function updateLink(id, payload) {
  const { data } = await api.patch(`/links/${id}`, payload);
  return data.data.link;
}

export async function deleteLink(id) {
  const { data } = await api.delete(`/links/${id}`);
  return data;
}
