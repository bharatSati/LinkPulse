import api from './api.js';

export async function listBioPages({ workspaceId, search, page, limit } = {}) {
  const params = { workspaceId };
  if (search) params.search = search;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await api.get('/bio-pages', { params });
  return data.data;
}

export async function getBioPage(id) {
  const { data } = await api.get(`/bio-pages/${id}`);
  return data.data;
}

export async function createBioPage(payload) {
  const { data } = await api.post('/bio-pages', payload);
  return data.data.bioPage;
}

export async function updateBioPage(id, payload) {
  const { data } = await api.patch(`/bio-pages/${id}`, payload);
  return data.data.bioPage;
}

export async function publishBioPage(id, isPublished) {
  const { data } = await api.patch(`/bio-pages/${id}/publish`, { isPublished });
  return data.data.bioPage;
}

export async function deleteBioPage(id) {
  const { data } = await api.delete(`/bio-pages/${id}`);
  return data.data;
}

export async function checkUsernameAvailability(username, excludeId) {
  const params = { username };
  if (excludeId) params.excludeId = excludeId;
  const { data } = await api.get('/bio-pages/check-username', { params });
  return data.data;
}

export async function getPublicBioPage(username) {
  const { data } = await api.get(`/public/bio/${encodeURIComponent(username)}`);
  return data.data.bioPage;
}
