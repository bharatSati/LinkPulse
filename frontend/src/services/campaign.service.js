import api from './api.js';

export async function listCampaigns({
  workspaceId,
  search,
  status,
  sort,
  from,
  to,
  page,
  limit,
} = {}) {
  const params = { workspaceId };
  if (search) params.search = search;
  if (status && status !== 'all') params.status = status;
  if (sort) params.sort = sort;
  if (from) params.from = from;
  if (to) params.to = to;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await api.get('/campaigns', { params });
  return data.data;
}

export async function listAllCampaigns(workspaceId, limit = 100) {
  const result = await listCampaigns({ workspaceId, limit, sort: 'name' });
  return result.campaigns;
}

export async function getCampaign(id) {
  const { data } = await api.get(`/campaigns/${id}`);
  return data.data;
}

export async function createCampaign(payload) {
  const { data } = await api.post('/campaigns', payload);
  return data.data.campaign;
}

export async function updateCampaign(id, payload) {
  const { data } = await api.patch(`/campaigns/${id}`, payload);
  return data.data.campaign;
}

export async function deleteCampaign(id) {
  const { data } = await api.delete(`/campaigns/${id}`);
  return data.data;
}

export async function listCampaignLinks(id, { search, filter, page, limit } = {}) {
  const params = {};
  if (search) params.search = search;
  if (filter && filter !== 'all') params.filter = filter;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await api.get(`/campaigns/${id}/links`, { params });
  return data.data;
}

export async function getCampaignAnalytics(id, query) {
  const { data } = await api.get(`/campaigns/${id}/analytics`, { params: query });
  return data.data;
}
