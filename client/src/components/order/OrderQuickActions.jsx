import React from "react";

const OrderQuickActions = ({ orderStats, currentFilter, onFilterChange }) => (
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
);

export default OrderQuickActions;