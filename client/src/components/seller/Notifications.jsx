import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useNotification } from "@/context/NotificationContext";
import { formatDateTime } from "@/utils/format";
import { Bell, Check, CheckCheck, Trash2, Filter, Calendar, Search } from "lucide-react";
import { toast } from "sonner";
import { assets } from "@/assets/assets";

const Notifications = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isSeller } = useSelector((state) => state.auth);
  const {
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleViewNotification,
  } = useNotification();

  // State
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    total_pages: 1,
    total: 0,
    current_page: 1,
  });

  // Load notifications
  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications(page, limit, filter === "unread" ? false : undefined);
      
      if (data) {
        let filteredNotifications = data.notifications || [];
        
        // Apply search filter
        if (searchQuery.trim() !== "") {
          filteredNotifications = filteredNotifications.filter(
            (notif) =>
              notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              notif.message.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        // Apply date filter
        if (dateFilter !== "all") {
          const now = new Date();
          filteredNotifications = filteredNotifications.filter((notif) => {
            const notifDate = new Date(notif.created_at);
            const diffTime = Math.abs(now - notifDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (dateFilter === "today") return diffDays <= 1;
            if (dateFilter === "week") return diffDays <= 7;
            if (dateFilter === "month") return diffDays <= 30;
            return true;
          });
        }
        
        setNotifications(filteredNotifications);
        setPagination(data.pagination || { total_pages: 1, total: 0, current_page: 1 });
      }
    } catch (error) {
      console.error("Load notifications error:", error);
      toast.error("Không thể tải thông báo");
    }
  };

  useEffect(() => {
    if (isAuthenticated && isSeller) {
      loadNotifications();
    }
  }, [page, filter, isAuthenticated, isSeller]);

  useEffect(() => {
    setPage(1);
    loadNotifications();
  }, [searchQuery, dateFilter]);

  // Handle select notification
  const handleSelectNotification = (notifId) => {
    setSelectedNotifications((prev) =>
      prev.includes(notifId)
        ? prev.filter((id) => id !== notifId)
        : [...prev, notifId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map((n) => n._id));
    }
  };

  // Handle mark selected as read
  const handleMarkSelectedAsRead = async () => {
    try {
      for (const notifId of selectedNotifications) {
        await markAsRead(notifId);
      }
      toast.success("Đã đánh dấu đã đọc");
      setSelectedNotifications([]);
      loadNotifications();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  // Handle delete selected
  const handleDeleteSelected = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedNotifications.length} thông báo?`)) {
      return;
    }
    
    try {
      for (const notifId of selectedNotifications) {
        await deleteNotification(notifId);
      }
      toast.success("Đã xóa thông báo");
      setSelectedNotifications([]);
      loadNotifications();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa");
    }
  };

  // Handle mark all as read
  const handleMarkAllAsReadClick = async () => {
    try {
      await markAllAsRead();
      toast.success("Đã đánh dấu tất cả đã đọc");
      loadNotifications();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    await handleViewNotification(notification);
    loadNotifications();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const icons = {
      order_new: "🛒",
      order_updated: "📦",
      order_cancelled: "❌",
      payment: "💰",
      system: "⚙️",
      promotion: "🎉",
    };
    return icons[type] || "🔔";
  };

  if (!isAuthenticated || !isSeller) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Vui lòng đăng nhập bằng tài khoản seller
          </h2>
          <Link
            to="/seller/login"
            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition"
          >
            Đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <section
              className="bg-cover bg-center py-20 text-center text-white"
              style={{ backgroundImage: `url(${assets.page_banner})` }}
            >
              <h1 className="text-5xl font-bold">Thông báo</h1>
              <ul className="flex justify-center gap-2 mt-2 text-sm">
                <li>
                  <Link to="/seller" className="hover:underline font-medium">
                    Dashboard
                  </Link>
                </li>
                <li className="font-medium">/ Thông báo</li>
              </ul>
            </section>

      {/* Filters Section */}
      <section className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-4">
          {/* Row 1: Filters and Actions */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Filter by status */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-600" />
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <option value="all">Tất cả ({pagination.total || 0})</option>
                <option value="unread">Chưa đọc ({unreadCount || 0})</option>
                <option value="read">Đã đọc ({(pagination.total || 0) - (unreadCount || 0)})</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-lg pl-10 pr-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2 border-l pl-3">
              <Calendar size={18} className="text-gray-600" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="week">7 ngày qua</option>
                <option value="month">30 ngày qua</option>
              </select>
            </div>

            <div className="flex-1"></div>

            {/* Actions */}
            {selectedNotifications.length > 0 && (
              <>
                <button
                  onClick={handleMarkSelectedAsRead}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                  <Check size={18} />
                  Đánh dấu đã đọc ({selectedNotifications.length})
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Xóa ({selectedNotifications.length})
                </button>
              </>
            )}

            {unreadCount > 0 && selectedNotifications.length === 0 && (
              <button
                onClick={handleMarkAllAsReadClick}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
              >
                <CheckCheck size={18} />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Row 2: Bulk actions */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t">
              <input
                type="checkbox"
                checked={selectedNotifications.length === notifications.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                {selectedNotifications.length > 0
                  ? `Đã chọn ${selectedNotifications.length}/${notifications.length}`
                  : "Chọn tất cả"}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Notifications List */}
      <section className="pb-16 container mx-auto px-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700">Đang tải thông báo...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition ${
                        !notification.is_read ? "bg-blue-50" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification._id)}
                        onChange={() => handleSelectNotification(notification._id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Icon */}
                      <div className="text-3xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3
                              className={`font-medium ${
                                !notification.is_read ? "text-gray-900" : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                              {!notification.is_read && (
                                <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                              <Calendar size={14} />
                              {formatDateTime(notification.created_at)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id).then(() => loadNotifications());
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                title="Đánh dấu đã đọc"
                              >
                                <Check size={18} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Bạn có chắc muốn xóa thông báo này?")) {
                                  deleteNotification(notification._id).then(() => {
                                    toast.success("Đã xóa thông báo");
                                    loadNotifications();
                                  });
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                              title="Xóa thông báo"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    Không có thông báo nào
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchQuery
                      ? "Không tìm thấy thông báo phù hợp"
                      : filter === "unread"
                      ? "Bạn không có thông báo chưa đọc"
                      : "Chưa có thông báo nào"}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className={`px-3 py-1 rounded transition ${
                      page === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-800 text-white hover:bg-gray-900"
                    }`}
                  >
                    {"<"}
                  </button>

                  {[...Array(pagination.total_pages)].map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => setPage(idx + 1)}
                      className={`px-3 py-1 rounded transition ${
                        page === idx + 1
                          ? "bg-gray-800 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    disabled={page === pagination.total_pages}
                    onClick={() => setPage(page + 1)}
                    className={`px-3 py-1 rounded transition ${
                      page === pagination.total_pages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-800 text-white hover:bg-gray-900"
                    }`}
                  >
                    {">"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default Notifications;