import api, { baseURL, getStoredToken } from './api.js';

export async function listLinks({ workspaceId, search, filter, campaignId, tagId, page, limit }) {
  const params = { workspaceId };
  if (search) params.search = search;
  if (filter && filter !== 'all') params.filter = filter;
  if (campaignId && campaignId !== 'all') params.campaignId = campaignId;
  if (tagId) params.tagId = tagId;
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

export async function getLinkQr(id, params = {}) {
  const { data } = await api.get(`/links/${id}/qr`, { params });
  return data.data;
}

export async function saveLinkQr(id, payload) {
  const { data } = await api.post(`/links/${id}/qr`, payload);
  return data.data;
}

export async function downloadImportTemplate(workspaceId) {
  const response = await api.get('/links/import/template', {
    params: { workspaceId },
    responseType: 'blob',
  });
  return response;
}

export async function importLinksCsv(workspaceId, file) {
  const form = new FormData();
  form.append('file', file);

  const token = getStoredToken();
  const response = await fetch(
    `${baseURL}/links/import?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }
  );

  let payload = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: payload?.message || 'The import could not be processed',
      errors: payload?.errors || [],
    };
  }

  return payload.data;
}

export async function getImportJob(importId) {
  const { data } = await api.get(`/links/import/${importId}`);
  return data.data.import;
}
