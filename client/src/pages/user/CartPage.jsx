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
  } = useCartContext();

  const subtotal = Array.isArray(cartItems)
    ? cartItems.reduce((total, item) => {
        const price =
          Number(item.product_id?.sale_price || item.product_id?.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
      }, 0)
    : 0;

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
          <CartTable
            cartItems={cartItems}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
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

        <CartTotals subtotal={subtotal} cartItems={cartItems} />
      </section>
    </main>
  );
};

export default CartPage;
