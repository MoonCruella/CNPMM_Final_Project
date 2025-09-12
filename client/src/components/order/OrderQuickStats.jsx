import React from "react";

const OrderQuickStats = ({ orderStats }) => {
  const quickStats = [
    {
      key: 'total',
      label: 'Tổng đơn hàng',
      value: orderStats.total,
      color: 'bg-blue-500',
      icon: '📦'
    },
    {
      key: 'pending',
      label: 'Chờ xác nhận',
      value: orderStats.pending,
      color: 'bg-gray-400',
      icon: '⏰'
    },
    {
      key: 'confirmed',
      label: 'Đã xác nhận',
      value: orderStats.confirmed,
      color: 'bg-indigo-500',
      icon: '✔️'
    },
    {
      key: 'processing',
      label: 'Đang chuẩn bị hàng',
      value: orderStats.processing,
      color: 'bg-yellow-500',
      icon: '🛒'
    },
    {
      key: 'shipped',
      label: 'Đang giao hàng',
      value: orderStats.shipped,
      color: 'bg-purple-500',
      icon: '🚚'
    },
    {
      key: 'delivered',
      label: 'Đã giao thành công',
      value: orderStats.delivered,
      color: 'bg-green-500',
      icon: '✅'
    },
    {
      key: 'cancelled',
      label: 'Đã hủy',
      value: orderStats.cancelled,
      color: 'bg-red-500',
      icon: '❌'
    },
    {
      key: 'cancel_request',
      label: 'Yêu cầu hủy',
      value: orderStats.cancel_request,
      color: 'bg-orange-500',
      icon: '🛑'
    }
  ];

  return (
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
  );
};

export default OrderQuickStats;