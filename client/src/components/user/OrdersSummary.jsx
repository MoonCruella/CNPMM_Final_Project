import React from "react";
import OrderQuickStats from "../order/OrderQuickStats";
import OrderTotalAmount from "../order/OrderTotalAmount";
import OrderQuickActions from "../order/OrderQuickActions";
import OrderSupport from "../order/OrderSupport";

const OrdersSummary = ({ orderStats, currentFilter, onFilterChange }) => (
  <div className="space-y-6">
    {/* Order Summary */}
    <div className="bg-white shadow rounded-xl p-6">
      <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
        📊 Tổng quan đơn hàng
      </h4>
      <OrderQuickStats orderStats={orderStats} />
      <OrderTotalAmount totalAmount={orderStats.totalAmount} />
    </div>

    {/* Quick Actions */}
    <div className="bg-white shadow rounded-xl p-6">
      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
        🚀 Thao tác nhanh
      </h4>
      <OrderQuickActions
        orderStats={orderStats}
        currentFilter={currentFilter}
        onFilterChange={onFilterChange}
      />
    </div>

    {/* Support */}
    <div className="bg-white shadow rounded-xl p-6">
      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
        💬 Hỗ trợ
      </h4>
      <OrderSupport />
    </div>
  </div>
);

export default OrdersSummary;