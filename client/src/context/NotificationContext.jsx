import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './SocketContext';
import { toast } from 'sonner';
import api from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Lấy số thông báo chưa đọc khi component mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data } = await api.get('/api/notifications/unread-count');
        if (data.success) {
          setUnreadCount(data.data.count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
  }, []);

  // Lắng nghe sự kiện từ socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Lắng nghe thông báo mới
    socket.on('new_notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Hiển thị toast thông báo với icon phù hợp
      toast(notification.title, {
        description: notification.message,
        action: {
          label: 'Xem',
          onClick: () => handleViewNotification(notification)
        },
        icon: getNotificationIcon(notification.type),
        duration: 5000
      });
    });

    // Lắng nghe cập nhật số lượng thông báo chưa đọc
    socket.on('notification_count', ({ count }) => {
      setUnreadCount(count);
    });

    // Cleanup
    return () => {
      socket.off('new_notification');
      socket.off('notification_count');
    };
  }, [socket, isConnected]);

  // Helper function để chọn icon phù hợp cho toast
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
      case 'order_created':
        return '🛒';
      case 'order_confirmed':
        return '✅';
      case 'order_processing':
        return '⚙️';
      case 'order_shipped':
        return '🚚';
      case 'order_delivered':
        return '📦';
      case 'order_cancelled':
        return '❌';
      case 'payment_received':
        return '💰';
      case 'new_product':
        return '🆕';
      case 'new_rating':
        return '⭐';
      default:
        return '🔔';
    }
  };

  // Lấy danh sách thông báo
  const fetchNotifications = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/notifications?page=${page}&limit=${limit}`);
      
      if (data.success) {
        setNotifications(data.data.notifications);
        return data.data;
      }
      return { notifications: [], pagination: { total: 0, total_pages: 0 } };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], pagination: { total: 0, total_pages: 0 } };
    } finally {
      setLoading(false);
    }
  }, []);

  // Đánh dấu thông báo đã đọc
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { data } = await api.patch(`/api/notifications/${notificationId}/read`);
      
      if (data.success) {
        // Cập nhật state
        setNotifications((prev) => 
          prev.map((notif) => 
            notif._id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        
        // Giảm số lượng thông báo chưa đọc
        setUnreadCount((prev) => Math.max(0, prev - 1));
        
        return data.data.notification;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Đánh dấu tất cả thông báo đã đọc
  const markAllAsRead = useCallback(async () => {
    try {
      const { data } = await api.patch('/api/notifications/read-all');
      
      if (data.success) {
        // Cập nhật state
        setNotifications((prev) => 
          prev.map((notif) => ({ ...notif, is_read: true }))
        );
        
        // Reset số lượng thông báo chưa đọc
        setUnreadCount(0);
        
        return true;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, []);

  // Xử lý khi click vào thông báo
  const handleViewNotification = useCallback((notification) => {
    markAsRead(notification._id);
    
    // Chuyển hướng dựa vào loại thông báo
    switch (notification.type) {
      // Tất cả các thông báo liên quan đến đơn hàng
      case 'new_order':
      case 'order_created':
      case 'order_confirmed':
      case 'order_processing':
      case 'order_shipped':
      case 'order_delivered':
      case 'order_cancelled':
      case 'payment_received':
        // Nếu có ID đơn hàng cụ thể, chuyển đến trang chi tiết đơn hàng
        if (notification.reference_id) {
          navigate(`/my-orders?order=${notification.reference_id}`);
        } else {
          // Không có ID cụ thể, chuyển đến trang danh sách đơn hàng
          navigate('/my-orders');
        }
        break;
        
      case 'new_product':
        navigate(`/product/${notification.reference_id}`);
        break;
        
      case 'new_rating':
        navigate(`/product/${notification.reference_id}`, {
          state: { scrollToReviews: true }
        });
        break;
        
      default:
        navigate('/dashboard', {
          state: { activeSection: 'notifications' }
        });
    }
  }, [navigate, markAsRead]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      handleViewNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};