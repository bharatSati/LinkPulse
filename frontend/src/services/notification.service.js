import api from './api.js';

export async function listNotifications({ workspaceId, page, limit, unreadOnly } = {}) {
  const params = {};
  if (workspaceId) params.workspaceId = workspaceId;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (unreadOnly) params.unreadOnly = 'true';

  const { data } = await api.get('/notifications', { params });
  return data.data;
}

export async function getUnreadCount(workspaceId) {
  const { data } = await api.get('/notifications/unread-count', {
    params: workspaceId ? { workspaceId } : undefined,
  });
  return data.data.unread;
}

export async function markNotificationRead(notificationId) {
  const { data } = await api.post(`/notifications/${notificationId}/read`);
  return data.data.notification;
}

export async function markAllNotificationsRead(workspaceId) {
  const { data } = await api.post('/notifications/read-all', null, {
    params: workspaceId ? { workspaceId } : undefined,
  });
  return data.data;
}
