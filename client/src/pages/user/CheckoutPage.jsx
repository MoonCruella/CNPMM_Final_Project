import React from "react";
import CheckoutSummary from "@/components/user/CheckoutSummary";
import CheckoutForm from "@/components/user/CheckoutForm";
import { Link } from "react-router-dom";
import { assets } from "@/assets/assets";
import { useCartContext } from "@/context/CartContext";
import { useAddressContext } from "@/context/AddressContext";
import { toast } from "sonner";

const Checkout = () => {
  const { selectedAddress, paymentMethod } = useAddressContext();
  const { items: cartItems = [] } = useCartContext();
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
        <h1 className="text-5xl font-bold">Checkout</h1>
        <ul className="flex justify-center gap-2 mt-2 text-sm">
          <li>
            <Link to="/" className="hover:underline font-medium">
              Home
            </Link>
          </li>
          <li className="font-medium">/ Checkout</li>
        </ul>
      </section>
      <div className="bg-gray-50 flex justify-center py-10">
        <div className="w-full max-w-7xl flex flex-col md:flex-row gap-5">
          {/* Form bên trái */}
          <div className="flex-1 border rounded-2xl shadow bg-white p-6">
            <CheckoutForm />
          </div>

          {/* Cart bên phải */}
          <div className="flex-1 border rounded-2xl shadow bg-white p-6">
            <CheckoutSummary
              cartItems={cartItems}
              subtotal={subtotal}
              selectedAddress={selectedAddress}
              paymentMethod={paymentMethod}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
