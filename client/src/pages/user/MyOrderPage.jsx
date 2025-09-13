import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { assets } from "@/assets/assets";
import { useUserContext } from "@/context/UserContext";
import OrdersTable from "@/components/user/OrdersTable";
import OrdersSummary from "@/components/user/OrdersSummary";
import orderService from "@/services/order.service";
import { toast } from "sonner";

const MyOrdersPage = () => {
  const { user, isAuthenticated } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState(""); 
  const searchInputRef = useRef(null);
  const [orderStats, setOrderStats] = useState({
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      cancel_request:0
    });

   const filteredOrdersByStatus = useMemo(() => {
    if (!Array.isArray(allOrders)) return [];
    
    if (filter === "all") {
      return allOrders;
    }
    return allOrders.filter(order => order.status === filter);
  }, [allOrders, filter]);

  // Search orders by product name using useMemo
  const searchedOrders = useMemo(() => {
    if (!searchTerm.trim()) {
      return filteredOrdersByStatus;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    return filteredOrdersByStatus.filter(order => {
      // Search in product names
      const hasMatchingProduct = order.items?.some(item => 
        item.product_id?.name?.toLowerCase().includes(searchLower)
      );
      
      // Optional: search in order number too
      const matchesOrderNumber = order.order_number?.toLowerCase().includes(searchLower);
      
      return hasMatchingProduct || matchesOrderNumber;
    });
  }, [filteredOrdersByStatus, searchTerm]);

   useEffect(() => {
    setOrders(searchedOrders);
  }, [searchedOrders]);

  // Load orders on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders();
    }
  }, [isAuthenticated, user, filter]);

  // Load orders from API
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getUserOrders(filter);

      if (response.success) {
        setOrders(response.data.orders || []);
        setOrderStats(response.data.stats || {});
      } else {
        toast.error(response.message || "Không thể tải danh sách đơn hàng");
      }
    } catch (error) {
      console.error("Load orders error:", error);
      toast.error("Có lỗi xảy ra khi tải đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ✅ Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // ✅ Handle filter change (also clears search)
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSearchTerm(""); // Clear search when changing filter
  };

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      return;
    }

    try {
      const response = await orderService.cancelOrder(orderId);

      if (response.success) {
        toast.success("Hủy đơn hàng thành công");
        loadOrders(); // Reload orders
      } else {
        toast.error(response.message || "Không thể hủy đơn hàng");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      toast.error("Có lỗi xảy ra khi hủy đơn hàng");
    }
  };

  // Reorder
  const handleReorder = async (orderId) => {
    try {
      const response = await orderService.reorder(orderId);

      if (response.success) {
        toast.success("Đã thêm sản phẩm vào giỏ hàng");
      } else {
        toast.error(response.message || "Không thể đặt lại đơn hàng");
      }
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Có lỗi xảy ra khi đặt lại đơn hàng");
    }
  };

  

  if (!isAuthenticated) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Vui lòng đăng nhập
          </h2>
          <p className="text-gray-600 mb-6">
            Bạn cần đăng nhập để xem đơn hàng
          </p>
          <Link
            to="/login"
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
        <h1 className="text-5xl font-bold">My Orders</h1>
        <ul className="flex justify-center gap-2 mt-2 text-sm">
          <li>
            <Link to="/" className="hover:underline font-medium">
              Home
            </Link>
          </li>
          <li className="font-medium">/ My Orders</li>
        </ul>
      </section>
      <section className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm theo tên sản phẩm hoặc mã đơn hàng..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ❌
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>🔍</span>
              <span>{orders.length} kết quả</span>
            </div>
          </div>
          
          {/* ✅ Search results info */}
          {searchTerm && (
            <div className="mt-3 text-sm text-blue-600">
              🔍 Tìm kiếm: "<strong>{searchTerm}</strong>" - 
              Tìm thấy <strong>{orders.length}</strong> đơn hàng
            </div>
          )}
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {[
              { key: "all", label: "Tất cả", count: orderStats.total, icon: "📦" },
              {
                key: "pending",
                label: "Chờ xác nhận",
                count: orderStats.pending,
                 icon: "⏰"
              },
              {
                key: "confirmed",
                label: "Đã xác nhận",
                count: orderStats.confirmed,
                icon: "✔️"
              },
              {
                key: "processing",
                label: "Đang xử lý",
                count: orderStats.processing,
                icon: "🛒"
              },
              { key: "shipped", label: "Đang giao", count: orderStats.shipped,icon: "🚚" },
              {
                key: "delivered",
                label: "Đã giao",
                count: orderStats.delivered,
                icon: "✅"
              },
              {
                key: "cancel_request",
                label: "Yêu cầu huỷ",
                count: orderStats.cancel_request,
                icon: "✅"
              },
              {
                key: "cancelled",
                label: "Đã hủy",
                count: orderStats.cancelled,
                icon: "❌"
              },
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
      <section className="pb-16 container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải đơn hàng...</p>
            </div>
          ) : (
            <OrdersTable
              orders={orders}
              onCancelOrder={handleCancelOrder}
              onReorder={handleReorder}
              isLoading={isLoading}
            />
          )}
        </div>

        <OrdersSummary
          orderStats={orderStats}
          currentFilter={filter}
          onFilterChange={setFilter}
        />
      </section>
    </main>
  );
};

export default MyOrdersPage;
