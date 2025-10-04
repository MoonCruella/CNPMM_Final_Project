import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from 'react-redux';
import OrdersTable from "@/components/user/OrdersTable";
import OrdersSummary from "@/components/user/OrdersSummary";
import orderService from "@/services/order.service";
import { toast } from "sonner";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";
import OrderSearchForm from "../order/OrderSearch";


const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user, isAuthenticated, isSeller } = useSelector((state) => state.auth);



  useEffect(() => {
    if (isAuthenticated && isSeller) {
      loadOrders();
    }
  }, [isAuthenticated, isSeller, filter, page]);

  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    cancel_request: 0
  });
  const handleSearch = async (searchParams) => {
    const response = await orderService.searchOrders({
      ...searchParams,
      status: filter === "all" ? undefined : filter
    }, false); // false = admin search
    if (response.success) {
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.total_pages);
    }
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getAllOrder(filter, page);
      if (response.success) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setOrderStats(response.data.stats || {});
      } else {
        toast.error(response.message || "Không thể tải danh sách đơn hàng");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tải đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };
  const handleUpdateShippingStatus = async (orderId, newStatus) => {
    try {
      // Gọi API cập nhật trạng thái vận chuyển
      const response = await orderService.updateShippingStatus(orderId, newStatus);
      if (response.success) {
        toast.success("Cập nhật trạng thái thành công!");
        loadOrders(); // Reload lại danh sách đơn hàng
      } else {
        toast.error(response.message || "Cập nhật thất bại!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  if (!isAuthenticated || user?.role !== "seller") {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Vui lòng đăng nhập bằng tài khoản admin
          </h2>
          <Link
            to="/seller/login"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Banner */}
      <section
        className="bg-cover bg-center py-20 text-center text-white"
        style={{ backgroundImage: `url(${assets.page_banner})` }}
      >
        <h1 className="text-5xl font-bold">Quản lý đơn hàng</h1>
        <ul className="flex justify-center gap-2 mt-2 text-sm">
          <li>
            <Link to="/seller/dashboard" className="hover:underline font-medium">
              Dashboard
            </Link>
          </li>
          <li className="font-medium">/ Quản lý đơn hàng</li>
        </ul>
      </section>

      {/* Filter Tabs */}
      <section className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {[
              { key: "all", label: "Tất cả", count: orderStats.total },
              { key: "pending", label: "Chờ xác nhận", count: orderStats.pending },
              { key: "confirmed", label: "Đã xác nhận", count: orderStats.confirmed },
              { key: "processing", label: "Đang xử lý", count: orderStats.processing },
              { key: "shipped", label: "Đang giao", count: orderStats.shipped },
              { key: "delivered", label: "Đã giao", count: orderStats.delivered },
              { key: "cancel_request", label: "Yêu cầu huỷ đơn", count: orderStats.cancel_request },
              { key: "cancelled", label: "Đã hủy", count: orderStats.cancelled },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${filter === tab.key
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {tab.label}
                <span
                  className={`px-2 py-1 rounded-full text-xs ${filter === tab.key
                    ? "bg-white text-green-600"
                    : "bg-gray-300 text-gray-600"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Orders Section */}
      <section className="pb-16 container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-4 relative">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải đơn hàng...</p>
            </div>
          ) : (
            <>{
              filter === "all" && (
                <OrderSearchForm onSearch={handleSearch} userRole="seller" />
              )}
              <OrdersTable
                orders={orders}
                isLoading={isLoading}
                isAdmin={true}
                onUpdateShippingStatus={handleUpdateShippingStatus}
                user={user}
              />
              {!isLoading && totalPages > 1 && (
                <div className="absolute right-6  bottom-[-48px]">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className={`px-3 py-1 rounded ${page === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-green-600 text-white"}`}
                    >
                      {"<"}
                    </button>
                    {[...Array(totalPages)].map((_, idx) => (
                      <button
                        key={idx + 1}
                        onClick={() => setPage(idx + 1)}
                        className={`px-3 py-1 rounded ${page === idx + 1 ? "bg-green-600 text-white" : "bg-gray-200"}`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className={`px-3 py-1 rounded ${page === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-green-600 text-white"}`}
                    >
                      {">"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Orders;