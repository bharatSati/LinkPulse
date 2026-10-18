import Notification from '../models/Notification.js';
import Workspace from '../models/Workspace.js';
import logger from '../utils/logger.js';

const MAX_PAGE_SIZE = 50;

export function serializeNotification(notification) {
  const value =
    typeof notification.toObject === 'function' ? notification.toObject() : notification;

  return {
    id: String(value._id),
    type: value.type,
    title: value.title,
    message: value.message || '',
    targetUrl: value.targetUrl || null,
    workspace: value.workspace ? String(value.workspace) : null,
    readAt: value.readAt || null,
    isRead: Boolean(value.readAt),
    data: value.data || {},
    createdAt: value.createdAt,
  };
}

/*
 * Creates a notification. When `dedupeKey` is supplied the key includes the
 * recipient so the same event never produces duplicate notifications for a
 * user. Failures never throw — notifications are best-effort and must not
 * break the primary operation (e.g. a redirect or link creation).
 */
export async function createNotification({
  recipient,
  workspace = null,
  type,
  title,
  message = '',
  targetUrl = null,
  dedupeKey = null,
  data = {},
}) {
  if (!recipient || !type || !title) return null;

  const key = dedupeKey ? `${dedupeKey}:${recipient}` : null;

  try {
    if (!key) {
      return await Notification.create({
        recipient,
        workspace: workspace || null,
        type,
        title,
        message,
        targetUrl,
        data,
        readAt: null,
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { dedupeKey: key },
      {
        $setOnInsert: {
          recipient,
          workspace: workspace || null,
          type,
          title,
          message,
          targetUrl,
          dedupeKey: key,
          data,
          readAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return notification;
  } catch (error) {
    if (error.code !== 11000) {
      logger.debug('[notifications] Failed to create notification:', error.message);
    }
    return null;
  }
}

async function recipientIds(workspace) {
  const ids = new Set();
  if (workspace.owner) ids.add(String(workspace.owner));
  for (const member of workspace.members || []) {
    if (member.role === 'owner' || member.role === 'admin') {
      ids.add(String(member.user));
    }
  }
  return [...ids];
}

export async function notifyWorkspaceAdmins({ workspaceId, ...payload }) {
  const workspace = await Workspace.findById(workspaceId).select('owner members');
  if (!workspace) return [];

  const ids = await recipientIds(workspace);
  return Promise.all(
    ids.map((recipient) =>
      createNotification({ recipient, workspace: workspaceId, ...payload })
    )
  );
}

export async function notifyUsers({ recipients, workspace = null, ...payload }) {
  const unique = [...new Set(recipients.filter(Boolean).map(String))];
  return Promise.all(
    unique.map((recipient) =>
      createNotification({ recipient, workspace, ...payload })
    )
  );
}

export async function listNotifications({
  userId,
  workspaceId,
  page = 1,
  limit = 20,
  unreadOnly = false,
}) {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);

  const query = { recipient: userId };
  if (workspaceId) query.workspace = workspaceId;
  if (unreadOnly) query.readAt = null;

  const [notifications, total, unread] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, ...(workspaceId ? { workspace: workspaceId } : {}), readAt: null }),
  ]);

  return {
    notifications: notifications.map(serializeNotification),
    unread,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export async function getUnreadCount({ userId, workspaceId }) {
  const query = { recipient: userId, readAt: null };
  if (workspaceId) query.workspace = workspaceId;
  return Notification.countDocuments(query);
}

export async function markNotificationRead({ userId, notificationId }) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  return notification ? serializeNotification(notification) : null;
}

export async function markAllNotificationsRead({ userId, workspaceId }) {
  const query = { recipient: userId, readAt: null };
  if (workspaceId) query.workspace = workspaceId;

  const result = await Notification.updateMany(query, { $set: { readAt: new Date() } });
  return { updated: result.modifiedCount || 0 };
}
