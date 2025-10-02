import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils/format';

const SellerNotificationBell = () => {
  const { 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    handleViewNotification 
  } = useNotification();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [page, setPage] = useState(1);
  const [notificationData, setNotificationData] = useState({
    notifications: [],
    pagination: { total_pages: 1, total: 0 }
  });

  // Xử lý khi click vào bell icon
  const handleBellClick = async () => {
    if (!showNotifications) {
      const data = await fetchNotifications(1, 5);
      setNotificationData(data);
      setPage(1);
    }
    setShowNotifications(!showNotifications);
  };

  // Xử lý khi chuyển trang
  const handleChangePage = async (newPage) => {
    const data = await fetchNotifications(newPage, 5);
    setNotificationData(data);
    setPage(newPage);
  };

  // Đánh dấu tất cả đã đọc và đóng dropdown
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setShowNotifications(false);
  };

  return (
    <div className="relative">
      <button 
        className="relative p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
        onClick={handleBellClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden border border-gray-200">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={handleMarkAllRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Đang tải...</div>
            ) : notificationData.notifications?.length > 0 ? (
              notificationData.notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  onClick={() => handleViewNotification(notification)}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{notification.title}</h4>
                    <span className="text-xs text-gray-500">{formatDateTime(notification.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">Không có thông báo nào</div>
            )}
          </div>
          
          {notificationData.pagination?.total_pages > 1 && (
            <div className="p-2 border-t border-gray-200 flex justify-center space-x-1">
              {Array.from({ length: notificationData.pagination.total_pages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChangePage(idx + 1)}
                  className={`w-7 h-7 text-sm rounded ${
                    page === idx + 1 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
          
          <div className="p-2 border-t border-gray-200 text-center">
            <a 
              href="/seller/notifications" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Xem tất cả thông báo
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerNotificationBell;