import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import OrdersTable from "@/components/user/OrdersTable";
import { assets } from "@/assets/assets";
import orderService from "@/services/order.service";
import { toast } from "sonner";
import { Calendar, Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, isSeller } = useSelector(
    (state) => state.auth
  );

  const [status, setStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search query - chỉ update sau 500ms user ngừng gõ
  const debouncedSearchQuery = useDebounce(searchQuery, 800);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Add sort states
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Order Statistics
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    cancel_request: 0,
  });

  const loadOrders = async () => {
    try {
      setIsLoading(true);

      let response;

      if (debouncedSearchQuery.trim() !== "") {
        response = await orderService.searchOrderAdmin(
          debouncedSearchQuery,
          status,
          page,
          limit,
          startDate,
          endDate,
          sortBy,
          sortOrder
        );
      } else {
        response = await orderService.getAllOrder(
          status,
          page,
          limit,
          startDate,
          endDate,
          sortBy,
          sortOrder
        );
      }

      if (response.success) {
        const data = response.data;

        setOrders(data.orders || []);
        console.log("Fetched orders:", data.orders || []);
        setTotalPages(data.pagination?.total_pages || data.totalPages || 1);
        setTotalOrders(data.pagination?.total_items || data.totalOrders || 0);

        if (data.stats) {
          setOrderStats(data.stats);
        }
      } else {
        toast.error(response.message || "Không thể tải danh sách đơn hàng");
        setOrders([]);
      }
    } catch (error) {
      console.error("Load orders error:", error);
      toast.error("Có lỗi xảy ra khi tải đơn hàng");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isSeller) {
      loadOrders();
    }
  }, [
    isAuthenticated,
    isSeller,
    page,
    status,
    debouncedSearchQuery,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, status, startDate, endDate]);

  const handleResetFilters = () => {
    setStatus("all");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field with desc order
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1); // Reset to first page
  };

  const handleCreateOrder = async (formData) => {
    try {
      const response = await orderService.createOrder(formData);
      if (response.success) {
        toast.success("Tạo đơn hàng thành công!");
        setIsCreateModalOpen(false);
        loadOrders();
      } else {
        toast.error(response.message || "Tạo đơn hàng thất bại!");
      }
    } catch (error) {
      console.error("Create order error:", error);
      toast.error("Có lỗi xảy ra khi tạo đơn hàng!");
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/seller/orders/${orderId}`);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleSaveOrder = async (orderId, formData) => {
    try {
      const response = await orderService.updateOrder(orderId, formData);
      if (response.success) {
        toast.success("Cập nhật đơn hàng thành công!");
        setIsEditModalOpen(false);
        setSelectedOrder(null);
        loadOrders();
      } else {
        toast.error(response.message || "Cập nhật thất bại!");
      }
    } catch (error) {
      console.error("Update order error:", error);
      toast.error("Có lỗi xảy ra khi cập nhật đơn hàng!");
    }
  };

  const handleDeleteOrder = (order) => {
    if (order.status !== "cancelled") {
      toast.error("Chỉ có thể xóa đơn hàng đã hủy!");
      return;
    }
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (orderId) => {
    try {
      const response = await orderService.deleteOrder(orderId);
      if (response.success) {
        toast.success("Xóa đơn hàng thành công!");
        loadOrders();
      } else {
        toast.error(response.message || "Xóa đơn hàng thất bại!");
      }
    } catch (error) {
      console.error("Delete order error:", error);
      toast.error("Có lỗi xảy ra khi xóa đơn hàng!");
    }
  };

  const handleQuickUpdateStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Bạn có chắc muốn cập nhật trạng thái đơn hàng này?`)) {
      return;
    }

    try {
      const response = await orderService.updateShippingStatus(
        orderId,
        newStatus
      );
      if (response.success) {
        toast.success("Cập nhật trạng thái thành công!");
        loadOrders();
      } else {
        toast.error(response.message || "Cập nhật thất bại!");
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  if (!isAuthenticated || user?.role !== "seller") {
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
        <h1 className="text-5xl font-bold">Quản lý đơn hàng</h1>
        <ul className="flex justify-center gap-2 mt-2 text-sm">
          <li>
            <Link to="/seller" className="hover:underline font-medium">
              Dashboard
            </Link>
          </li>
          <li className="font-medium">/ Quản lý đơn hàng</li>
        </ul>
      </section>

      {/* Bộ lọc */}
      <section className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-4">
          {/* Row 1: Status, Search, Date Filter, Actions */}
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="all">
                Tất cả trạng thái ({orderStats.total || 0})
              </option>
              <option value="pending">
                Chờ xác nhận ({orderStats.pending || 0})
              </option>
              <option value="confirmed">
                Đã xác nhận ({orderStats.confirmed || 0})
              </option>
              <option value="processing">
                Đang xử lý ({orderStats.processing || 0})
              </option>
              <option value="shipped">
                Đang giao ({orderStats.shipped || 0})
              </option>
              <option value="delivered">
                Đã giao ({orderStats.delivered || 0})
              </option>
              <option value="cancel_request">
                Yêu cầu hủy ({orderStats.cancel_request || 0})
              </option>
              <option value="cancelled">
                Đã hủy ({orderStats.cancelled || 0})
              </option>
            </select>

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm mã đơn hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-lg pl-10 pr-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {searchQuery !== debouncedSearchQuery && (
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Đang tìm kiếm...
              </span>
            )}

            {/* Date Range Filter */}
            <div className="flex items-center gap-2 border-l pl-3">
              <Calendar size={18} className="text-gray-600" />
              <label className="text-sm text-gray-600 font-medium">Từ:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || new Date().toISOString().split("T")[0]}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">Đến:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split("T")[0]}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div className="flex-1"></div>

            <button
              onClick={handleResetFilters}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-medium flex items-center gap-2"
            >
              🔄 Xóa bộ lọc
            </button>

            <button
              onClick={loadOrders}
              disabled={isLoading}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition disabled:bg-gray-400"
            >
              {isLoading ? "⏳ Đang tải..." : "🔃 Tải lại"}
            </button>
          </div>
        </div>
      </section>

      {/* Bảng đơn hàng */}
      <section className="pb-16 container mx-auto px-4">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700">Đang tải đơn hàng...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <OrdersTable
                orders={orders}
                isLoading={false}
                user={user}
                isSeller={true}
                onViewOrder={handleViewOrder}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
                onUpdateStatus={handleQuickUpdateStatus}
                onSort={handleSort}
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
              />
            </div>

            {totalPages > 1 && (
              <div className="flex justify-end mt-6">
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

                  {[...Array(totalPages)].map((_, idx) => (
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
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className={`px-3 py-1 rounded transition ${
                      page === totalPages
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

export default Orders;
