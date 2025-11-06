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
    const query = new URLSearchParams(location.search);

    // Nếu quay về từ gateway (VNPay / ZaloPay) — không redirect về cart ngay
    // (CheckoutSummary sẽ xử lý callback và lưu đơn / xoá giỏ hàng)
    if (
      query.get("success") !== null ||
      query.get("apptransid") !== null ||
      query.get("orderId") !== null
    ) {
      // Thử phục hồi các item đang chờ thanh toán từ localStorage (nếu có)
      const pendingIds = JSON.parse(
        localStorage.getItem("pendingCartItems") || "[]"
      );
      if (
        Array.isArray(pendingIds) &&
        pendingIds.length > 0 &&
        Array.isArray(allCartItems) &&
        allCartItems.length > 0
      ) {
        const pendingItems = allCartItems.filter((it) =>
          pendingIds.includes(it._id)
        );
        if (pendingItems.length > 0) {
          setSelectedItems(pendingItems);
        }
      }
      // chờ CheckoutSummary xử lý callback, không redirect
      return;
    }

    // 1) ưu tiên items được truyền khi navigate từ Cart
    const navSelected = location.state?.selectedItems;
    if (Array.isArray(navSelected) && navSelected.length > 0) {
      setSelectedItems(navSelected);
      return;
    }

    // 2) dùng selected items từ CartContext (nếu có)
    const ctxSelected =
      typeof getSelectedItems === "function" ? getSelectedItems() : [];
    if (Array.isArray(ctxSelected) && ctxSelected.length > 0) {
      setSelectedItems(ctxSelected);
      return;
    }

    // 3) fallback: nếu trong cart còn items -> dùng toàn bộ cart
    if (Array.isArray(allCartItems) && allCartItems.length > 0) {
      setSelectedItems(allCartItems);
      return;
    }

    // 4) không có item ở đâu -> báo lỗi và quay về cart
    toast.error("Vui lòng chọn sản phẩm trước khi thanh toán");
    navigate("/cart");
  }, [location, allCartItems, getSelectedItems, navigate]);

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
        <h1 className="text-5xl font-bold">Thanh toán</h1>
        <ul className="flex justify-center gap-2 mt-2 text-sm">
          <li>
            <Link to="/" className="hover:underline font-medium">
              Home
            </Link>
          </li>
          <li className="font-medium">/ Thanh toán</li>
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
