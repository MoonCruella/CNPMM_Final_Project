import React from "react";

const CartTotals = ({ subtotal }) => {
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
      <button className="w-full mt-6 bg-green-600 text-white py-3 font-medium rounded-lg hover:bg-green-700">
        Proceed to Checkout
      </button>
    </div>
  );
};

export default CartTotals;
