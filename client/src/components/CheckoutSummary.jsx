import { React, useState, useEffect } from "react";
import ItemRow from "./item/ItemRow";
import orderService from "@/services/order.service";
import { useNavigate, useLocation } from "react-router-dom";
import { useCartContext } from "@/context/CartContext";
import vnpayService from "@/services/vnpayService";

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
  const location = useLocation();

  // Xử lý kết quả từ VNPay redirect
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const success = query.get("success");
    const orderId = query.get("orderId");

    if (success) {
      if (success === "true" && orderId) {
        // Lấy lại orderData từ localStorage
        const orderData = JSON.parse(localStorage.getItem("pendingOrderData"));
        if (orderData) {
          setLoading(true);
          orderService.createOrder(orderData).then(async (res) => {
            if (res.success) {
              alert("Thanh toán VNPay thành công và đơn hàng đã được lưu!");
              await clearCart();
              localStorage.removeItem("pendingOrderData");
              navigate("/my-orders");
            } else {
              alert("Lưu đơn hàng thất bại: " + res.message);
            }
            setLoading(false);
          });
        }
      } else {
        alert("Thanh toán VNPay thất bại hoặc bị hủy!");
        localStorage.removeItem("pendingOrderData");
      }
    }
  }, [location]);

  const handlePayNow = async () => {
    if (!selectedAddress) return alert("Vui lòng chọn địa chỉ");
    if (!paymentMethod) return alert("Vui lòng chọn phương thức thanh toán");

    try {
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
        payment_method: paymentMethod,
        notes: "",
      };

      if (paymentMethod === "vnpay") {
        setLoading(true);
        const tempOrderId = new Date().getTime(); // ví dụ dùng timestamp làm id tạm
        orderData.orderId = tempOrderId;
        // Lưu orderData tạm để khi return về còn dùng
        localStorage.setItem("pendingOrderData", JSON.stringify(orderData));

        const { success, url, message } = await vnpayService.createPayment(
          orderData.orderId,
          subtotal
        );

        if (success) {
          window.location.href = url; // redirect sang VNPay
        } else {
          setLoading(false);
          alert("Tạo thanh toán thất bại: " + message);
        }
      } else {
        // COD -> tạo order trực tiếp
        setLoading(true);
        const res = await orderService.createOrder(orderData);
        if (res.success) {
          alert("Đặt hàng thành công!");
          await clearCart();
          navigate("/my-orders");
        } else {
          alert("Đặt hàng thất bại: " + res.message);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Create order error:", err);
      alert("Đặt hàng thất bại: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="animate-spin border-4 border-green-600 border-t-transparent rounded-full w-10 h-10 mx-auto"></div>
            <p className="mt-3 text-gray-700 font-medium">
              Đang xử lý thanh toán...
            </p>
          </div>
        </div>
      )}
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
