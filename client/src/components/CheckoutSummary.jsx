import { React, useState } from "react";
import ItemRow from "./item/ItemRow";
import orderService from "@/services/order.service";
import cartService from "@/services/cartService";
import { useNavigate } from "react-router-dom";
import { useCartContext } from "@/context/CartContext";

const CheckoutSummary = ({
  cartItems,
  subtotal,
  selectedAddress,
  paymentMethod,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { clearCart } = useCartContext();
  const navigate = useNavigate();
  const handlePayNow = async () => {
    console.log("Địa chỉ:" + selectedAddress.full_address);
    console.log("PTTT:" + paymentMethod);

    if (!selectedAddress) return alert("Vui lòng chọn địa chỉ");
    if (!paymentMethod) return alert("Vui lòng chọn phương thức thanh toán");
    try {
      setLoading(true);

      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product_id._id,
          quantity: item.quantity,
        })),
        shipping_info: {
          name: selectedAddress.full_name,
          phone: selectedAddress.phone,
          address: selectedAddress.full_address,
        },
        payment_method: paymentMethod, // ví dụ "cod"
        notes: "",
      };

      const res = await orderService.createOrder(orderData);
      if (res.success) {
        alert("Đặt hàng thành công!");
        await clearCart();
        navigate("/");
      } else {
        alert("Đặt hàng thất bại: " + res.message);
      }
    } catch (err) {
      console.error("Create order error:", err);
      alert("Đặt hàng thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Review your cart</h3>
        <div className="overflow-y-auto max-h-[500px] shadow rounded-xl bg-white custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-yellow-500 ">
              <tr>
                <th className="py-3 px-4 text-white">Products</th>
                <th className="py-3 px-4 text-white">Quantity</th>
                <th className="py-3 px-6 text-right text-white">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(cartItems) && cartItems.length > 0 ? (
                cartItems.map((item) => <ItemRow key={item._id} item={item} />)
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

        <div className="flex mt-5 items-center mb-4">
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
            <span>{subtotal.toLocaleString("vi-VN")}₫</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>0₫</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="text-green-600">-0đ</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total</span>
            <span>{subtotal.toLocaleString("vi-VN")}₫</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="mt-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="w-4 h-4 accent-green-600 focus:ring-0"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <span className="ml-2 text-sm text-gray-600">
            Tôi đã đọc và đồng ý với Điều khoản và Chính sách.
          </span>
        </label>
      </div>

      {/* Pay Now */}
      <div className="flex justify-center mt-10">
        <button
          type="submit"
          onClick={handlePayNow}
          disabled={!termsAccepted || loading} // chỉ enable khi checkbox được tick
          className={`w-3/4 font-bold text-white py-3 rounded-xl transition
            ${
              termsAccepted
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          Pay Now
        </button>
      </div>
    </div>
  );
};

export default CheckoutSummary;
