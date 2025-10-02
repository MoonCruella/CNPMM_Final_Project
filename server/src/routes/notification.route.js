import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = express.Router();
// Lấy số thông báo chưa đọc
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

// Đánh dấu thông báo đã đọc
router.patch('/:notificationId/read', authenticateToken, notificationController.markAsRead);

// Đánh dấu tất cả thông báo đã đọc
router.patch('/read-all', authenticateToken, notificationController.markAllAsRead);

// Lấy danh sách thông báo
router.get('/', authenticateToken, notificationController.getNotifications);

export default router;