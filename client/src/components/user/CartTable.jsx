import React from "react";
import CartItemRow from "./item/CartItemRow";

const CartTable = ({ cartItems, updateQuantity, removeFromCart }) => {
  return (
    <div className="overflow-x-auto shadow rounded-xl bg-white">
      {/* Giới hạn chiều cao + thêm overflow-y-auto để có thanh lăn dọc */}
      <div className="max-h-120 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-green-700 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 text-white">Products</th>
              <th className="py-3 px-4 text-white">Quantity</th>
              <th className="py-3 px-4 text-right text-white">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(cartItems) && cartItems.length > 0 ? (
              cartItems.map((item) => (
                <CartItemRow
                  key={item._id}
                  item={item}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="py-6 text-center text-gray-500 font-medium"
                >
                  Your cart is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CartTable;
