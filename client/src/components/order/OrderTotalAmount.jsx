import React from "react";

const OrderTotalAmount = ({ totalAmount }) => {
  const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + '₫';

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-1">Tổng giá trị đơn hàng</p>
        <p className="text-2xl font-bold text-green-600">
          {formatCurrency(totalAmount)}
        </p>
      </div>
    </div>
  );
};

export default OrderTotalAmount;