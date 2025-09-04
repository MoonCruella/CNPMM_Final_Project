import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { assets } from "@/assets/assets";
import { useUserContext } from "@/context/UserContext";
import OrdersTable from "@/components/OrdersTable";
import OrdersSummary from "@/components/OrdersSummary";
import orderService from "@/services/order.service";
import { toast } from "sonner";

const MyOrdersPage = () => {
  const { user, isAuthenticated } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, processing, shipped, delivered, cancelled
  
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
      } else {
        toast.error(response.message || 'Không thể tải danh sách đơn hàng');
      }
    } catch (error) {
      console.error('Load orders error:', error);
      toast.error('Có lỗi xảy ra khi tải đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      const response = await orderService.cancelOrder(orderId);
      
      if (response.success) {
        toast.success('Hủy đơn hàng thành công');
        loadOrders(); // Reload orders
      } else {
        toast.error(response.message || 'Không thể hủy đơn hàng');
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error('Có lỗi xảy ra khi hủy đơn hàng');
    }
  };

  // Reorder
  const handleReorder = async (orderId) => {
    try {
      const response = await orderService.reorder(orderId);
      
      if (response.success) {
        toast.success('Đã thêm sản phẩm vào giỏ hàng');
      } else {
        toast.error(response.message || 'Không thể đặt lại đơn hàng');
      }
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Có lỗi xảy ra khi đặt lại đơn hàng');
    }
  };

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter(order => order.status === 'pending').length,
    processing: orders.filter(order => order.status === 'processing').length,
    shipped: orders.filter(order => order.status === 'shipped').length,
    delivered: orders.filter(order => order.status === 'delivered').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length,
    totalAmount: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  };

  if (!isAuthenticated) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem đơn hàng</p>
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

      {/* Filter Tabs */}
      <section className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {[
              { key: 'all', label: 'Tất cả', count: orderStats.total },
              { key: 'pending', label: 'Chờ xác nhận', count: orderStats.pending },
              { key: 'processing', label: 'Đang xử lý', count: orderStats.processing },
              { key: 'shipped', label: 'Đang giao', count: orderStats.shipped },
              { key: 'delivered', label: 'Đã giao', count: orderStats.delivered },
              { key: 'cancelled', label: 'Đã hủy', count: orderStats.cancelled }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  filter === tab.key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-1 rounded-full text-xs ${
                  filter === tab.key 
                    ? 'bg-white text-green-600' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
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