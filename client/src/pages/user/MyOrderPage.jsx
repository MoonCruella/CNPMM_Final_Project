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
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get('orderId');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
  const [initialOrderLoaded, setInitialOrderLoaded] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const ORDERS_PER_PAGE = 10;

  // Intersection Observer ref for infinite scroll
  const loadMoreTriggerRef = useRef(null);

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

  useEffect(() => {
    if (orderIdFromUrl && isAuthenticated) {
      loadSpecificOrder(orderIdFromUrl);
    }
  }, [orderIdFromUrl, isAuthenticated]);

  const loadSpecificOrder = async (orderId) => {
    try {
      setIsLoading(true);

      const response = await orderService.getOrderById(orderId);

      if (response.success) {
        const order = response.data.order || response.data;

        if (!order._id) {
          console.error('❌ Order missing _id:', order);
          toast.error("Dữ liệu đơn hàng không hợp lệ");
          setSearchParams({});
          return;
        }

        setSelectedOrderId(orderId);

        setOrders(prev => {
          const exists = prev.find(o => o._id === orderId);
          if (exists) {
            return prev;
          }
          return [order, ...prev];
        });

        // Load other orders immediately
        await loadOtherOrders(orderId);

        // Mark as loaded to enable infinite scroll
        setInitialOrderLoaded(true);

        // Scroll after render
        setTimeout(() => {
          const elementId = `order-${orderId}`;
          const orderCard = document.getElementById(elementId);

          if (orderCard) {
            orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            orderCard.classList.add('ring-4', 'ring-blue-500', 'ring-offset-2');
            setTimeout(() => {
              orderCard.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-2');
            }, 3000);
          }

          const modal = document.querySelector('[role="dialog"]');

        }, 1500);

      } else {
        console.error('❌ API failed');
        toast.error("Không tìm thấy đơn hàng");
        setSearchParams({});
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error("Có lỗi xảy ra");
      setSearchParams({});
    } finally {
      setIsLoading(false);
    }
  };

  const loadOtherOrders = async (excludeOrderId) => {
    try {

      const response = await orderService.getUserOrders(filter, 1, ORDERS_PER_PAGE);

      if (response.success) {
        const { orders: newOrders, stats, pagination } = response.data;

        // Filter out the order we already have
        const filteredOrders = newOrders.filter(o => o._id !== excludeOrderId);


        setOrders(prev => {
          // Keep the specific order at top, add others below
          const specificOrder = prev.find(o => o._id === excludeOrderId);
          if (specificOrder) {
            return [specificOrder, ...filteredOrders];
          }
          return filteredOrders;
        });

        setOrderStats(stats || {});
        setTotalOrders(pagination?.total || 0);
        setHasMore((pagination?.current_page || 1) < (pagination?.total_pages || 1));
      }
    } catch (error) {
      console.error("Load other orders error:", error);
    }
  };

  // Initial load - skip if loading specific order
  useEffect(() => {
    if (isAuthenticated && user && !orderIdFromUrl) {
      resetAndLoadOrders();
    }
  }, [isAuthenticated, user, filter]);

  // Search effect với debounce
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    if (searchTerm.trim() !== "") {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      setSearchDebounceTimer(timer);
    } else {
      resetAndLoadOrders();
    }

    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchTerm]);

  // Intersection Observer - Enable after initial load
  useEffect(() => {
    // Allow infinite scroll if:
    // 1. No orderIdFromUrl, OR
    // 2. orderIdFromUrl exists BUT initialOrderLoaded is true
    const shouldDisableScroll = orderIdFromUrl && !initialOrderLoaded;

    if (!loadMoreTriggerRef.current || !hasMore || isLoadingMore || isLoading || shouldDisableScroll) {
      if (shouldDisableScroll) {
      }
      return;
    }


    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMoreOrders();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreTriggerRef.current);

    return () => {
      if (loadMoreTriggerRef.current) {
        observer.unobserve(loadMoreTriggerRef.current);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, currentPage, orderIdFromUrl, initialOrderLoaded]);

  // Handle Search
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

      const response = await orderService.searchOrders(searchParams, true);

      if (response.success) {
        const { orders: searchResults, pagination } = response.data;
        setOrders(searchResults || []);
        setCurrentPage(1);
        setTotalOrders(pagination?.total_orders || 0);
        setHasMore((pagination?.current_page || 1) < (pagination?.total_pages || 1));
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

  // Reset and load orders
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

  // Load more orders (auto-triggered by intersection observer)
  const loadMoreOrders = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;

      // Nếu đang search
      if (isSearching && searchTerm.trim()) {
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
      }
      // Browse bình thường
      else {
        const response = await orderService.getUserOrders(filter, nextPage, ORDERS_PER_PAGE);

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
      }
    } catch (error) {
      console.error("Load more orders error:", error);
      toast.error("Có lỗi xảy ra khi tải thêm đơn hàng");
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, filter, hasMore, isLoadingMore, isLoading, orders.length, isSearching, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
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
    setSearchParams({});
    setInitialOrderLoaded(false);
    resetAndLoadOrders();
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
    <div className="max-w-[1215px] mx-auto px-4">
      {/* Notification Banner */}
      <section className="">       
        {/* Search Bar - Matching width */}
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
            
          </div>

        </div>
      </section>

      {/* Filter Tabs - Matching width, no extra space */}
      <section>
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden"> 
          <div className="flex gap-2 p-2 overflow-x-auto"> 
            {[
              { key: "all", label: "Tất cả", count: orderStats.total },
              { key: "pending", label: "Chờ xác nhận", count: orderStats.pending },
              { key: "confirmed", label: "Đã xác nhận", count: orderStats.confirmed },
              { key: "processing", label: "Đang xử lý", count: orderStats.processing },
              { key: "shipped", label: "Đang giao", count: orderStats.shipped },
              { key: "delivered", label: "Đã giao", count: orderStats.delivered },
              { key: "cancel_request", label: "Yêu cầu hủy", count: orderStats.cancel_request },
              { key: "cancelled", label: "Đã hủy", count: orderStats.cancelled },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                  filter === tab.key
                    ? "bg-green-600 text-white shadow-md scale-105 hover:bg-green-700 cursor-pointer"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                }`}
              >
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

      {/* Orders List - Matching width */}
      <section className="pb-16">
        {isLoading && !isLoadingMore ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">
              {orderIdFromUrl
                ? "Đang tải đơn hàng..."
                : isSearching
                  ? "Đang tìm kiếm..."
                  : "Đang tải đơn hàng..."}
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
            {/* Orders List */}
            <div className="space-y-4">
              {orders.map((order, index) => {
                if (!order?._id) {
                  console.warn('⚠️ Order without _id at index', index, order);
                }

                const shouldAutoOpen = selectedOrderId && order._id === selectedOrderId;

                const orderKey = shouldAutoOpen
                  ? `${order._id}-highlighted-${Date.now()}`
                  : order._id || `order-${index}`;

                return (
                  <OrderCard
                    key={orderKey}
                    orderId={order._id}
                    order={order}
                    onCancelOrder={handleCancelOrder}
                    onReorder={handleReorder}
                    onUpdateShippingStatus={handleUpdateShippingStatus}
                    user={user}
                    autoOpen={shouldAutoOpen}
                    onModalClose={handleCloseOrderDetail}
                  />
                );
              })}
            </div>

            {hasMore && (
              <div
                ref={loadMoreTriggerRef}
                className="flex justify-center items-center py-8 min-h-[80px]"
              >
                {isLoadingMore ? (
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Đang tải thêm...</p>
                  </div>
                ) : orderIdFromUrl && !initialOrderLoaded ? (
                  <div className="text-center text-gray-400 text-sm">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p>Đang tải đơn hàng...</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm invisible">
                    <p>Cuộn xuống để tải thêm...</p>
                  </div>
                )}
              </div>
            )}

            {!hasMore && orders.length > 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full">
                  <span className="text-2xl">🎉</span>
                  <p className="text-gray-600 font-medium">
                    Đã hiển thị tất cả {orders.length} đơn hàng
                    {isSearching && searchTerm && ` cho "${searchTerm}"`}
                  </p>
                </div>
              </div>
            )}
          </>
        )}  
      </section>
    </div>
  </main>
  );
};

export default MyOrdersPage;