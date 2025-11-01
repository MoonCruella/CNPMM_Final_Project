import React, { useEffect, useState } from "react";
import CheckoutSummary from "@/components/user/CheckoutSummary";
import CheckoutForm from "@/components/user/CheckoutForm";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { assets } from "@/assets/assets";
import { useCartContext } from "@/context/CartContext";
import { useAddressContext } from "@/context/AddressContext";
import { toast } from "sonner";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedAddress, paymentMethod } = useAddressContext();
  const { items: allCartItems = [], getSelectedItems } = useCartContext();

  // Lấy selected items từ navigation state hoặc context
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    // Priority 1: From navigation state (cart page)
    if (location.state?.selectedItems && location.state.selectedItems.length > 0) {
      setSelectedItems(location.state.selectedItems);
    } 
    // Priority 2: From cart context (direct access)
    else if (getSelectedItems && getSelectedItems().length > 0) {
      setSelectedItems(getSelectedItems());
    }
    // Priority 3: No selection - redirect back
    else {
      toast.error('Vui lòng chọn sản phẩm trước khi thanh toán');
      navigate('/cart');
    }
  }, [location.state, getSelectedItems, navigate]);

  //Calculate subtotal from selected items only
  const subtotal = Array.isArray(selectedItems)
    ? selectedItems.reduce((total, item) => {
        const price =
          Number(item.product_id?.sale_price || item.product_id?.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
      }, 0)
    : 0;

  // Show loading if no items yet
  if (selectedItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

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

      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            
            <Link
              to="/cart"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              ← Quay lại giỏ hàng
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 flex justify-center py-10">
        <div className="w-full max-w-7xl flex flex-col md:flex-row gap-5 px-4">
          {/* Form bên trái */}
          <div className="flex-1 border rounded-2xl shadow bg-white p-6">
            <CheckoutForm />
          </div>

          {/* Cart bên phải */}
          <div className="flex-1 border rounded-2xl shadow bg-white p-6">
            <CheckoutSummary
              cartItems={selectedItems} 
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