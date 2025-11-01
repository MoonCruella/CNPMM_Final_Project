import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const OrdersTable = ({ 
  orders, 
  isLoading, 
  user, 
  isSeller = false,
  onViewOrder,
  onUpdateStatus,
  onDeleteOrder,
  onSort // ✅ Add callback for sorting
}) => {
  const navigate = useNavigate();

  // ✅ Remove useMemo - let backend handle sorting
  const displayOrders = Array.isArray(orders) ? orders : [];

  const handleSort = (field) => {
    // ✅ Call parent component to fetch sorted data from backend
    if (onSort) {
      onSort(field);
    }
  };

  const getSortIcon = (field, currentSortBy, currentSortOrder) => {
    if (currentSortBy !== field) return "↕️";
    return currentSortOrder === "asc" ? "↑" : "↓";
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
      confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
      processing: { label: "Đang xử lý", color: "bg-purple-100 text-purple-700" },
      shipped: { label: "Đang giao", color: "bg-indigo-100 text-indigo-700" },
      delivered: { label: "Đã giao", color: "bg-green-100 text-green-700" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
      cancel_request: { label: "Yêu cầu hủy", color: "bg-orange-100 text-orange-700" },
    };

    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700" };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleRowClick = (orderId) => {
    if (onViewOrder) {
      onViewOrder(orderId);
    } else if (user?.role === "seller") {
      navigate(`/seller/orders/${orderId}`);
    } else {
      navigate(`/user/orders/${orderId}`);
    }
  };

  const getNextStatusOptions = (currentStatus) => {
    const statusFlow = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      cancel_request: ["cancelled"],
    };
    return statusFlow[currentStatus] || [];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-800">
          <tr>
            <th className="py-3 px-4 text-white">
              <div className="flex items-center gap-2">
                Mã đơn hàng
              </div>
            </th>
            <th className="py-3 px-4 text-white text-center">
              Trạng thái
            </th>
            <th
              className="py-3 px-4 text-white cursor-pointer hover:bg-gray-700 transition"
              onClick={() => handleSort("created_at")}
            >
              <div className="flex items-center gap-2">
                Ngày tạo đơn <span className="text-sm">↕️</span>
              </div>
            </th>
            <th
              className="py-3 px-4 text-white text-right cursor-pointer hover:bg-gray-700 transition"
              onClick={() => handleSort("total_amount")}
            >
              <div className="flex items-center justify-end gap-2">
                Tổng tiền <span className="text-sm">↕️</span>
              </div>
            </th>
            
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayOrders.length > 0 ? (
            displayOrders.map((order) => (
              <tr
                key={order._id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td 
                  className="py-4 px-4 cursor-pointer"
                  onClick={() => handleRowClick(order._id)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">
                      {order.order_number}
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.items?.length || 0} sản phẩm
                    </span>
                  </div>
                </td>

                <td className="py-4 px-4 text-center">
                  {getStatusBadge(order.status)}
                </td>

                <td 
                  className="py-4 px-4 cursor-pointer"
                  onClick={() => handleRowClick(order._id)}
                >
                  <span className="text-gray-700">
                    {formatDate(order.created_at)}
                  </span>
                </td>

                <td 
                  className="py-4 px-4 text-right cursor-pointer"
                  onClick={() => handleRowClick(order._id)}
                >
                  <span className="font-semibold text-green-600">
                    {formatCurrency(order.total_amount)}
                  </span>
                </td>

              
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={isSeller ? 5 : 4} className="py-8 text-center text-gray-500">
                Không có đơn hàng nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(OrdersTable);