import api from './api.js';

export async function previewInvitation(token) {
  const { data } = await api.get(`/invitations/${token}`);
  return data.data;
}

export async function acceptInvitation(token) {
  const { data } = await api.post('/invitations/accept', { token });
  return data.data;
}

export async function rejectInvitation(token) {
  const { data } = await api.post('/invitations/reject', { token });
  return data.data;
}
