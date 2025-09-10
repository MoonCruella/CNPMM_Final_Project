import React from "react";

const OrdersSummary = ({ orderStats, currentFilter, onFilterChange }) => {
  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('vi-VN') + '₫';
  };

  const quickStats = [
    {
      key: 'total',
      label: 'Tổng đơn hàng',
      value: orderStats.total,
      color: 'bg-blue-500',
      icon: '📦'
    },
    {
      key: 'delivered',
      label: 'Đã giao thành công',
      value: orderStats.delivered,
      color: 'bg-green-500',
      icon: '✅'
    },
    {
      key: 'processing',
      label: 'Đang xử lý',
      value: orderStats.processing,
      color: 'bg-yellow-500',
      icon: '⏳'
    },
    {
      key: 'cancelled',
      label: 'Đã hủy',
      value: orderStats.cancelled,
      color: 'bg-red-500',
      icon: '❌'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-white shadow rounded-xl p-6">
        <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
          📊 Tổng quan đơn hàng
        </h4>
        
        {/* Quick Stats */}
        <div className="space-y-4">
          {quickStats.map((stat) => (
            <div key={stat.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.color} rounded-full flex items-center justify-center text-white font-bold`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Amount */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Tổng giá trị đơn hàng</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(orderStats.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-xl p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          🚀 Thao tác nhanh
        </h4>
        
        <div className="space-y-3">
          <button
            onClick={() => onFilterChange('pending')}
            className={`w-full text-left p-3 rounded-lg transition flex items-center justify-between ${
              currentFilter === 'pending' 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span>⏰</span>
              <div>
                <p className="font-medium">Chờ xác nhận</p>
                <p className="text-xs text-gray-500">Đơn hàng cần theo dõi</p>
              </div>
            </div>
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {orderStats.pending}
            </span>
          </button>

          <button
            onClick={() => onFilterChange('shipped')}
            className={`w-full text-left p-3 rounded-lg transition flex items-center justify-between ${
              currentFilter === 'shipped' 
                ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span>🚚</span>
              <div>
                <p className="font-medium">Đang giao hàng</p>
                <p className="text-xs text-gray-500">Theo dõi vận chuyển</p>
              </div>
            </div>
            <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
              {orderStats.shipped}
            </span>
          </button>

          <button
            onClick={() => window.location.href = '/products'}
            className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <span>🛒</span>
            <span>Tiếp tục mua sắm</span>
          </button>
        </div>
      </div>

      {/* Support */}
      <div className="bg-white shadow rounded-xl p-6">
        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
          💬 Hỗ trợ
        </h4>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <span>📞</span>
            <div>
              <p className="font-medium">Hotline: 1900-xxxx</p>
              <p className="text-xs">Hỗ trợ 24/7</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-600">
            <span>✉️</span>
            <div>
              <p className="font-medium">support@example.com</p>
              <p className="text-xs">Email hỗ trợ</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-600">
            <span>💬</span>
            <div>
              <p className="font-medium">Chat trực tuyến</p>
              <p className="text-xs">8:00 - 22:00 hàng ngày</p>
            </div>
          </div>
        </div>

        <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
          Liên hệ hỗ trợ
        </button>
      </div>
    </div>
  );
};

export default OrdersSummary;