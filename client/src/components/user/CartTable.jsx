import React from "react";
import CartItemRow from "./item/CartItemRow";

const CartTable = ({ 
  cartItems, 
  updateQuantity, 
  removeFromCart,
  selectedItems = [], 
  toggleSelectItem 
}) => {
  return (
    <div className="overflow-x-auto shadow rounded-xl bg-white">
      <div className="max-h-120 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-green-700 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 w-12">
                <span className="sr-only">Select</span>
              </th>
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
                  isSelected={selectedItems.includes(item._id)} 
                  onToggleSelect={() => toggleSelectItem(item._id)} 
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="4" 
                  className="py-6 text-center text-gray-500 font-medium"
                >
                  Giỏ hàng trống
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