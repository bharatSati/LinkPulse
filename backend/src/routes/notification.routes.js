import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validObjectId } from '../middleware/objectId.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.list);

router.get('/unread-count', notificationController.unreadCount);

router.post('/read-all', notificationController.markAllRead);

router.post('/:id/read', validObjectId('id'), notificationController.markRead);

export default router;
