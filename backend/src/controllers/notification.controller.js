import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { successResponse } from '../utils/ApiResponse.js';
import * as notificationService from '../services/notification.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await notificationService.listNotifications({
    userId: req.user.id,
    workspaceId: req.query.workspaceId,
    page: req.query.page,
    limit: req.query.limit,
    unreadOnly: req.query.unreadOnly === 'true',
  });

  return successResponse(res, {
    message: 'Notifications retrieved',
    data,
  });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const unread = await notificationService.getUnreadCount({
    userId: req.user.id,
    workspaceId: req.query.workspaceId,
  });

  return successResponse(res, {
    message: 'Unread count retrieved',
    data: { unread },
  });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead({
    userId: req.user.id,
    notificationId: req.params.id,
  });

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  return successResponse(res, {
    message: 'Notification marked as read',
    data: { notification },
  });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAllNotificationsRead({
    userId: req.user.id,
    workspaceId: req.query.workspaceId,
  });

  return successResponse(res, {
    message: 'All notifications marked as read',
    data,
  });
});
