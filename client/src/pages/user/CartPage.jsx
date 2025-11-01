import React from "react";
import { Link } from "react-router-dom";
import { assets } from "@/assets/assets";
import { useCartContext } from "@/context/CartContext";
import CartTable from "@/components/user/CartTable";
import CartTotals from "@/components/user/CartTotals";

const CartPage = () => {
  const {
    items: cartItems = [],
    updateQuantity,
    removeFromCart,
    selectedItems, // ✅ NEW
    toggleSelectItem, // ✅ NEW
    selectAllItems, // ✅ NEW
    deselectAllItems, // ✅ NEW
    isAllSelected, // ✅ NEW
    getSelectedItems, // ✅ NEW
    getSelectedTotal, // ✅ NEW
  } = useCartContext();

  // ✅ Calculate total for ALL items
  const subtotal = Array.isArray(cartItems)
    ? cartItems.reduce((total, item) => {
        const price =
          Number(item.product_id?.sale_price || item.product_id?.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
      }, 0)
    : 0;

  // ✅ Calculate total for SELECTED items only
  const selectedTotal = getSelectedTotal();
  const selectedItemsCount = selectedItems.length;

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Banner */}
      <section
        className="bg-cover bg-center py-20 text-center text-white"
        style={{ backgroundImage: `url(${assets.page_banner})` }}
      >
        <h1 className="text-5xl font-bold">Cart</h1>
        <ul className="flex justify-center gap-2 mt-2 text-sm">
          <li>
            <Link to="/" className="hover:underline font-medium">
              Home
            </Link>
          </li>
          <li className="font-medium">/ Cart</li>
        </ul>
      </section>

      {/* Cart Section */}
      <section className="py-16 container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 flex flex-col">
          {/*  Selection Summary Bar */}
          {cartItems.length > 0 && (
            <div className="bg-white shadow rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => {
                    if (isAllSelected) {
                      deselectAllItems();
                    } else {
                      selectAllItems();
                    }
                  }}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                />
                <label className="font-medium text-gray-700 cursor-pointer select-none">
                  Chọn tất cả ({cartItems.length} sản phẩm)
                </label>
              </div>

              {selectedItemsCount > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Đã chọn: <span className="font-semibold text-green-700">{selectedItemsCount}</span> sản phẩm
                  </span>
                  <button
                    onClick={deselectAllItems}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cart Table */}
          <CartTable
            cartItems={cartItems}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            selectedItems={selectedItems} 
            toggleSelectItem={toggleSelectItem} 
          />

          <div className="mt-5 flex justify-end">
            <Link
              to="/products"
              className="hover:underline font-medium text-primary"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        <CartTotals 
          subtotal={selectedTotal} 
          cartItems={getSelectedItems()} 
          selectedCount={selectedItemsCount}
          totalCount={cartItems.length}
        />
      </section>
    </main>
  );
};

export default CartPage;