import api from './api.js';

export async function getOverview(query) {
  const { data } = await api.get('/analytics/overview', { params: query });
  return data.data;
}

export async function getClicksOverTime(query) {
  const { data } = await api.get('/analytics/clicks-over-time', { params: query });
  return data.data;
}

export async function getTopLinks(query) {
  const { data } = await api.get('/analytics/top-links', { params: query });
  return data.data;
}

export async function getReferrers(query) {
  const { data } = await api.get('/analytics/referrers', { params: query });
  return data.data;
}

export async function getDevices(query) {
  const { data } = await api.get('/analytics/devices', { params: query });
  return data.data;
}

export async function getBrowsers(query) {
  const { data } = await api.get('/analytics/browsers', { params: query });
  return data.data;
}

export async function getLocations(query) {
  const { data } = await api.get('/analytics/locations', { params: query });
  return data.data;
}

export async function getLinkAnalytics(linkId, query) {
  const { data } = await api.get(`/analytics/links/${linkId}`, { params: query });
  return data.data;
}
