import React, { useState, useMemo } from "react";
import OrderItemRow from "./item/OrderItemRow";

const OrdersTable = ({ orders, onCancelOrder, onReorder, isLoading }) => {
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Memoize sorted orders để tránh re-sort mỗi render
  const sortedOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];

    return [...orders].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "created_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === "total_amount") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [orders, sortBy, sortOrder]); // Chỉ re-compute khi dependencies thay đổi

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
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
    <div className="overflow-x-auto shadow rounded-xl bg-white">
      <table className="w-full text-left">
        <thead className="bg-green-700">
          <tr>
            <th
              className="py-3 px-4 text-white cursor-pointer hover:bg-green-800 transition"
              onClick={() => handleSort("created_at")}
            >
              <div className="flex items-center gap-2">
                Đơn hàng {getSortIcon("created_at")}
              </div>
            </th>
            <th className="py-3 px-4 text-white">Sản phẩm</th>
            <th className="py-3 px-4 text-white">Trạng thái</th>
            <th
              className="py-3 px-4 text-white text-right cursor-pointer hover:bg-green-800 transition"
              onClick={() => handleSort("total_amount")}
            >
              <div className="flex items-center justify-end gap-2">
                Tổng tiền {getSortIcon("total_amount")}
              </div>
            </th>
            <th className="py-3 px-4 text-white text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.length > 0 ? (
            sortedOrders.map((order) => (
              <OrderItemRow
                key={order._id}
                order={order}
                onCancelOrder={onCancelOrder}
                onReorder={onReorder}
              />
            ))
          ) : (
            <tr>
              <td colSpan="5" className="py-12 text-center text-gray-500">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    📦
                  </div>
                  <div>
                    <p className="font-medium text-lg">Chưa có đơn hàng nào</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Hãy bắt đầu mua sắm để tạo đơn hàng đầu tiên
                    </p>
                  </div>
                  <button
                    onClick={() => (window.location.href = "/products")}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Khám phá sản phẩm
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(OrdersTable);
