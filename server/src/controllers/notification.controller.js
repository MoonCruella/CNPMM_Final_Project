import Notification from '../models/notification.model.js';
import response from '../helpers/response.js';

// Lấy danh sách thông báo của user đang đăng nhập
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await Notification.getByUser(userId, page, limit);
    
    return response.sendSuccess(res, {
      notifications: result.notifications,
      pagination: result.pagination
    }, 'Lấy danh sách thông báo thành công');
  } catch (error) {
    console.error('Error getting notifications:', error);
    return response.sendError(res, 'Lỗi khi lấy danh sách thông báo');
  }
};

// Đếm số thông báo chưa đọc
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const count = await Notification.countUnread(userId);
    
    return response.sendSuccess(res, { count }, 'Lấy số thông báo chưa đọc thành công');
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return response.sendError(res, 'Lỗi khi đếm thông báo chưa đọc');
  }
};

// Đánh dấu thông báo đã đọc
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;
    
    const notification = await Notification.markAsRead(notificationId, userId);
    
    if (!notification) {
      return response.sendError(res, 'Không tìm thấy thông báo', 404);
    }
    
    return response.sendSuccess(res, { notification }, 'Đánh dấu thông báo đã đọc thành công');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return response.sendError(res, 'Lỗi khi đánh dấu thông báo đã đọc');
  }
};

// Đánh dấu tất cả thông báo đã đọc
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await Notification.markAllAsRead(userId);
    
    return response.sendSuccess(res, { result }, 'Đánh dấu tất cả thông báo đã đọc thành công');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return response.sendError(res, 'Lỗi khi đánh dấu tất cả thông báo đã đọc');
  }
};

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};