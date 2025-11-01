import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux'; // ✅ Import useSelector
import { useSocket } from './SocketContext';
import { toast } from 'sonner';
import api from '../services/api';
import { useAppContext } from './AppContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAppContext();
  
  // Lấy user từ Redux store
  const { user } = useSelector((state) => state.auth);
  
  // Lấy số thông báo chưa đọc khi component mount
  useEffect(() => {
    if (isAuthenticated) {
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
    }
  }, [isAuthenticated]); 

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

  // Xóa thông báo
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const { data } = await api.delete(`/api/notifications/${notificationId}`);
      
      if (data.success) {
        // Remove from state
        setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
        
        // Update unread count if it was unread
        const notification = notifications.find(n => n._id === notificationId);
        if (notification && !notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [notifications]);

  // Xử lý khi click vào thông báo - CHECK ROLE từ Redux
  const handleViewNotification = useCallback((notification) => {
    markAsRead(notification._id);
    
    const notificationType = notification.type;
    
    // Check user role từ Redux
    const isSeller = user?.role === 'seller';
    const isAdmin = user?.role === 'admin';
    
    
    // List tất cả các order-related types
    const orderTypes = [
      'new_order',
      'order_created', 
      'order_confirmed',
      'order_processing',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'payment_received',
      'order_status' ,
      'cancel_request'
    ];
        
    if (orderTypes.includes(notificationType)) {
      if (notification.reference_id) {
        // Navigate based on role
        const url = (isSeller || isAdmin) 
          ? `/seller/orders/${notification.reference_id}`
          : `/user/orders/${notification.reference_id}`;
        
        console.log('🔗 Navigating to:', url);
        navigate(url);
        return;
      } else {
        // Navigate to orders list based on role
        const url = (isSeller || isAdmin) ? '/seller/orders' : '/user/orders';
        console.log('🔗 Navigating to orders list:', url);
        navigate(url);
        return;
      }
    }
    
    // Product notifications
    if (notificationType === 'new_product') {
      if (notification.reference_id) {
        navigate(`/products/${notification.reference_id}`);
        return;
      } else {
        navigate('/products');
        return;
      }
    }

   
    
    // Rating notifications
    if (notificationType === 'new_rating') {
      if (notification.reference_id) {
        navigate(`/products/${notification.reference_id}`, {
          state: { scrollToReviews: true }
        });
        return;
      } else {
        navigate('/products');
        return;
      }
    }

    
    //  Default navigation based on role
    if (isSeller || isAdmin) {
      navigate('/seller/notifications');
    } else {
      navigate('/user/dashboard', {
        state: { activeSection: 'notifications' }
      });
    }
    
  }, [navigate, markAsRead, user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification, 
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