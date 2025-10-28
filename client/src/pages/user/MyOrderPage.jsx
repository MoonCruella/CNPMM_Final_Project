import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { assets } from "@/assets/assets";
import { useUserContext } from "@/context/UserContext";
import OrderCard from "@/components/user/OrderCard";
import orderService from "@/services/order.service";
import { toast } from "sonner";

const MyOrdersPage = () => {
  const { user, isAuthenticated } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);
  //  NEW: Get orderId from URL query params
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get('orderId');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const ORDERS_PER_PAGE = 10;
  
  // Intersection Observer ref
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

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
  // ✅ NEW: Effect để xử lý orderId từ URL
  useEffect(() => {
    if (orderIdFromUrl && isAuthenticated) {
      // Load order cụ thể và mở modal
      loadSpecificOrder(orderIdFromUrl);
    }
  }, [orderIdFromUrl, isAuthenticated]);

  // ✅ NEW: Load order cụ thể từ URL
  const loadSpecificOrder = async (orderId) => {
    try {
      setIsLoading(true);
      
      // Fetch order detail
      const response = await orderService.getOrderById(orderId);
      
      if (response.success) {
        const order = response.data;
        
        // Thêm order vào list nếu chưa có
        setOrders(prev => {
          const exists = prev.find(o => o._id === orderId);
          if (exists) return prev;
          return [order, ...prev];
        });
        
        // Set selected order để mở modal
        setSelectedOrderId(orderId);
        
        // Scroll đến order card
        setTimeout(() => {
          const orderCard = document.getElementById(`order-${orderId}`);
          if (orderCard) {
            orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
        
        console.log('✅ Loaded specific order:', orderId);
      } else {
        toast.error("Không tìm thấy đơn hàng");
        // Remove orderId from URL if not found
        setSearchParams({});
      }
    } catch (error) {
      console.error("Load specific order error:", error);
      toast.error("Có lỗi xảy ra khi tải đơn hàng");
      setSearchParams({});
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated && user) {
      resetAndLoadOrders();
    }
  }, [isAuthenticated, user, filter]);

  // Search effect với debounce
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    if (searchTerm.trim() !== "") {
      // Debounce 500ms
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      setSearchDebounceTimer(timer);
    } else {
      // Nếu search rỗng, load lại orders bình thường
      resetAndLoadOrders();
    }

    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchTerm]);

  // Setup Intersection Observer for infinite scroll
  useEffect(() => {
    // ✅ Không dùng infinite scroll khi đang search
    if (isSearching || !loadMoreRef.current || !hasMore || isLoadingMore) return;

    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isSearching) {
        loadMoreOrders();
      }
    }, options);

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, currentPage, filter, isSearching]);

  // ✅ Handle Search - Gọi API backend
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setIsSearching(false);
      resetAndLoadOrders();
      return;
    }

    try {
      setIsSearching(true);
      setIsLoading(true);

      const searchParams = {
        q: searchTerm.trim(),
        status: filter !== "all" ? filter : undefined,
        page: 1,
        limit: ORDERS_PER_PAGE,
        sort: "created_at",
        order: "desc",
      };

      const response = await orderService.searchOrders(searchParams, true); // isMyOrders = true

      if (response.success) {
        const { orders: searchResults, pagination } = response.data;

        setOrders(searchResults || []);
        setCurrentPage(1);
        setTotalOrders(pagination?.total_orders || 0);
        setHasMore((pagination?.current_page || 1) < (pagination?.total_pages || 1));

        console.log('🔍 Search results:', {
          query: searchTerm,
          found: searchResults?.length || 0,
          total: pagination?.total_orders || 0,
        });
      } else {
        toast.error(response.message || "Không thể tìm kiếm đơn hàng");
        setOrders([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Có lỗi xảy ra khi tìm kiếm");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Load more search results
  const loadMoreSearchResults = async () => {
    if (!isSearching || !searchTerm.trim() || !hasMore || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;

      const searchParams = {
        q: searchTerm.trim(),
        status: filter !== "all" ? filter : undefined,
        page: nextPage,
        limit: ORDERS_PER_PAGE,
        sort: "created_at",
        order: "desc",
      };

      const response = await orderService.searchOrders(searchParams, true);

      if (response.success) {
        const { orders: newOrders, pagination } = response.data;

        if (newOrders && newOrders.length > 0) {
          setOrders((prev) => [...prev, ...newOrders]);
          setCurrentPage(nextPage);
          setHasMore((pagination?.current_page || nextPage) < (pagination?.total_pages || 1));
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Load more search results error:", error);
      toast.error("Có lỗi xảy ra khi tải thêm kết quả");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Reset and load orders (when filter changes)
  const resetAndLoadOrders = async () => {
    try {
      setIsLoading(true);
      setIsSearching(false);
      setCurrentPage(1);
      setOrders([]);
      
      const response = await orderService.getUserOrders(filter, 1, ORDERS_PER_PAGE);

      if (response.success) {
        const { orders: newOrders, stats, pagination } = response.data;
        
        setOrders(newOrders || []);
        setOrderStats(stats || {});
        setTotalOrders(pagination?.total || 0);
        setHasMore((pagination?.current_page || 1) < (pagination?.total_pages || 1));
        
        console.log('📦 Initial load:', {
          loaded: newOrders?.length || 0,
          total: pagination?.total || 0,
          hasMore: (pagination?.current_page || 1) < (pagination?.total_pages || 1)
        });
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

  // Load more orders (infinite scroll) - CHỈ cho browse bình thường
  const loadMoreOrders = useCallback(async () => {
    // ✅ Nếu đang search, dùng loadMoreSearchResults thay vì loadMoreOrders
    if (isSearching) {
      loadMoreSearchResults();
      return;
    }

    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      
      console.log('🔄 Loading more orders, page:', nextPage);
      
      const response = await orderService.getUserOrders(filter, nextPage, ORDERS_PER_PAGE);

      if (response.success) {
        const { orders: newOrders, pagination } = response.data;
        
        if (newOrders && newOrders.length > 0) {
          setOrders((prev) => [...prev, ...newOrders]);
          setCurrentPage(nextPage);
          setHasMore((pagination?.current_page || nextPage) < (pagination?.total_pages || 1));
          
          console.log('✅ Loaded more:', {
            newItems: newOrders.length,
            totalLoaded: orders.length + newOrders.length,
            total: pagination?.total || 0,
          });
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Load more orders error:", error);
      toast.error("Có lỗi xảy ra khi tải thêm đơn hàng");
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, filter, hasMore, isLoadingMore, orders.length, isSearching]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    // Reset về load bình thường
    resetAndLoadOrders();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSearchTerm("");
    setIsSearching(false);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      return;
    }

    try {
      const response = await orderService.cancelOrder(orderId);

      if (response.success) {
        toast.success("Hủy đơn hàng thành công");
        // ✅ Reload based on search state
        if (isSearching && searchTerm.trim()) {
          handleSearch();
        } else {
          resetAndLoadOrders();
        }
      } else {
        toast.error(response.message || "Không thể hủy đơn hàng");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      toast.error("Có lỗi xảy ra khi hủy đơn hàng");
    }
  };

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

  const handleUpdateShippingStatus = async (orderId, newStatus) => {
    try {
      const response = await orderService.updateShippingStatus(orderId, newStatus);

      if (response.success) {
        toast.success("Cập nhật trạng thái thành công");
        // ✅ Reload based on search state
        if (isSearching && searchTerm.trim()) {
          handleSearch();
        } else {
          resetAndLoadOrders();
        }
      } else {
        toast.error(response.message || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };
  const handleCloseOrderDetail = () => {
    setSelectedOrderId(null);
    setSearchParams({}); // Remove orderId from URL
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

      {/* Search Bar */}
      <section className="container mx-auto px-4 pt-8">
        {orderIdFromUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <span className="text-blue-600">🔔</span>
            <span className="text-sm text-blue-800">
              Bạn đang xem đơn hàng từ thông báo
            </span>
            <button
              onClick={handleCloseOrderDetail}
              className="ml-auto text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Quay lại danh sách
            </button>
          </div>
        )}

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
              {isSearching ? (
                <>
                  <span>🔍</span>
                  <span className="text-blue-600 font-medium">
                    {orders.length} kết quả
                  </span>
                </>
              ) : (
                <>
                  <span>📦</span>
                  <span>{orders.length} / {totalOrders}</span>
                </>
              )}
            </div>
          </div>

          {searchTerm && (
            <div className="mt-3 flex items-center gap-2">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang tìm kiếm...</span>
                </div>
              ) : (
                <div className="text-sm text-blue-600">
                  🔍 Tìm kiếm: "<strong>{searchTerm}</strong>" - Tìm thấy{" "}
                  <strong>{orders.length}</strong> đơn hàng
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {[
              { key: "all", label: "Tất cả", count: orderStats.total, icon: "📦" },
              {
                key: "pending",
                label: "Chờ xác nhận",
                count: orderStats.pending,
                icon: "⏰",
              },
              {
                key: "confirmed",
                label: "Đã xác nhận",
                count: orderStats.confirmed,
                icon: "✔️",
              },
              {
                key: "processing",
                label: "Đang xử lý",
                count: orderStats.processing,
                icon: "🛒",
              },
              {
                key: "shipped",
                label: "Đang giao",
                count: orderStats.shipped,
                icon: "🚚",
              },
              {
                key: "delivered",
                label: "Đã giao",
                count: orderStats.delivered,
                icon: "✅",
              },
              {
                key: "cancel_request",
                label: "Yêu cầu hủy",
                count: orderStats.cancel_request,
                icon: "🔄",
              },
              {
                key: "cancelled",
                label: "Đã hủy",
                count: orderStats.cancelled,
                icon: "❌",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  filter === tab.key
                    ? "bg-green-600 text-white shadow-md scale-105"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    filter === tab.key
                      ? "bg-white text-green-600"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Orders List - Full Width */}
      <section className="container mx-auto px-4 pb-16">
        {isLoading && !isLoadingMore ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isSearching ? "Đang tìm kiếm..." : "Đang tải đơn hàng..."}
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Chưa có đơn hàng
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? `Không tìm thấy đơn hàng phù hợp với "${searchTerm}"`
                : "Bạn chưa có đơn hàng nào"}
            </p>
            <Link
              to="/products"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  orderId={order._id}
                  order={order}
                  onCancelOrder={handleCancelOrder}
                  onReorder={handleReorder}
                  onUpdateShippingStatus={handleUpdateShippingStatus}
                  user={user}
                  autoOpen={order._id === selectedOrderId} 
                  onModalClose={handleCloseOrderDetail}
                />
              ))}
            </div>

            {/* Load More Trigger */}
            {hasMore && !orderIdFromUrl && (
              <div
                ref={loadMoreRef}
                className="flex justify-center items-center py-8"
              >
                {isLoadingMore ? (
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Đang tải thêm đơn hàng...</p>
                  </div>
                ) : (
                  <button
                    onClick={loadMoreOrders}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Xem thêm đơn hàng
                  </button>
                )}
              </div>
            )}
            
            {!hasMore && orders.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  🎉 Đã hiển thị tất cả {orders.length} đơn hàng
                  {isSearching && ` cho "${searchTerm}"`}
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default MyOrdersPage;