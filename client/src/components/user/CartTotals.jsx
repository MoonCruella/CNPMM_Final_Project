import React from "react";
import { useNavigate } from "react-router-dom";

const CartTotals = ({ subtotal, cartItems }) => {
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (cartItems.length === 0) return; // không làm gì nếu giỏ rỗng
    navigate("/checkout");
  };

  const isDisabled = cartItems.length === 0 || subtotal <= 0;

  return (
    <div className="bg-white shadow rounded-xl p-6 h-fit">
      <h4 className="text-xl font-bold mb-4">Cart Totals</h4>
      <ul className="space-y-3">
        <li className="flex justify-between">
          <span>Subtotal</span>
          <span>{subtotal.toLocaleString("vi-VN")}₫</span>
        </li>
        <li className="flex justify-between">
          <span>Shipping Cost</span>
          <span>0₫</span>
        </li>
        <li className="flex justify-between">
          <span>Discount</span>
          <span>0₫</span>
        </li>
        <li className="flex justify-between font-semibold text-lg border-t pt-3">
          <span>Total</span>
          <span>{subtotal.toLocaleString("vi-VN")}₫</span>
        </li>
      </ul>
      <button
        onClick={handleCheckout}
        disabled={isDisabled}
        className={`w-full mt-6 py-3 font-medium rounded-lg transition
          ${
            isDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
      >
        Proceed to Checkout
      </button>
      {isDisabled && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Giỏ hàng rỗng, không thể thanh toán
        </p>
      )}
    </div>
  );
};

export default CartTotals;
