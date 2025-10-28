import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils/format';

const NotificationsPanel = () => {
  const { loading, fetchNotifications, markAsRead, markAllAsRead, handleViewNotification } = useNotification();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [notificationData, setNotificationData] = useState({
    notifications: [],
    pagination: { total_pages: 1, total: 0 }
  });

  // Fetch notifications khi component mount hoặc khi page/limit thay đổi
  useEffect(() => {
    const loadNotifications = async () => {
      const data = await fetchNotifications(page, limit);
      setNotificationData(data);
    };
    
    loadNotifications();
  }, [page, limit]);
  
  

  // Phân loại thông báo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
          </svg>
        );
      
      case 'new_rating':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      
      case 'new_product':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        );
      
      case 'new_comment':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
          </svg>
        );
      
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tất cả thông báo</h1>
        
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      ) : notificationData.notifications?.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {notificationData.notifications.map((notification) => (
            <div 
              key={notification._id}
              onClick={() => handleViewNotification(notification)}
              className={`p-4 flex items-start border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition ${
                !notification.is_read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex-shrink-0 mr-4">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{notification.title}</h3>
                  <span className="text-sm text-gray-500">{formatDateTime(notification.created_at)}</span>
                </div>
                <p className="text-gray-600 mt-1">{notification.message}</p>
              </div>
            </div>
          ))}
          
          <div className="p-4 flex justify-between items-center bg-gray-50">
            <div>
              <span className="text-sm text-gray-600">
                Hiển thị {notificationData.notifications.length} trên {notificationData.pagination.total} thông báo
              </span>
            </div>
            
            <div className="flex space-x-1">
              {Array.from({ length: notificationData.pagination.total_pages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded ${
                    page === idx + 1 
                      ? 'bg-green-700 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-10 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900">Không có thông báo</h2>
          <p className="mt-2 text-gray-500">Bạn chưa có thông báo nào.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;