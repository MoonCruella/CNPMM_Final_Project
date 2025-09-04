import React from "react";

const CartSummary = () => {
  return (
    <div>
      <div className="bg-gray-50 rounded-2xl p-6 shadow-inner">
        <h3 className="text-lg font-semibold mb-4">Review your cart</h3>

        <div className="flex justify-between items-center mb-3">
          <span>DuoComfort Sofa Premium</span>
          <span className="font-medium">$20.00</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span>IronOne Desk</span>
          <span className="font-medium">$25.00</span>
        </div>

        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="Discount code"
            className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none"
          />
          <button className="bg-gray-200 px-4 py-2 rounded-r-lg">Apply</button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>$45.00</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>$5.00</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="text-green-600">- $10.00</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total</span>
            <span>$40.00</span>
          </div>
        </div>
      </div>
      <button
        type="submit"
        className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition"
      >
        Pay Now
      </button>
    </div>
  );
};

export default CartSummary;
