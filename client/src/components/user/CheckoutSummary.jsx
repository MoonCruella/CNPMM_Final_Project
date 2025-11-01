import React, { useState, useEffect } from "react";
import ItemRow from "./item/ItemRow";
import orderService from "@/services/order.service";
import { useNavigate, useLocation } from "react-router-dom";
import { useCartContext } from "@/context/CartContext";
import vnpayService from "@/services/vnpay.service";
import zalopayService from "@/services/zalopay.service";
import VoucherModal from "@/components/user/modal/VoucherModal";
import voucherService from "@/services/voucherService";
import { assets } from "@/assets/assets";
import { toast } from "sonner";

const CheckoutSummary = ({
  cartItems,
  subtotal,
  selectedAddress,
  paymentMethod,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { removeMultipleItems } = useCartContext(); 
  const navigate = useNavigate();
  const location = useLocation();

  // Voucher states
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedFreeship, setSelectedFreeship] = useState(null);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [voucherPreviewDiscount, setVoucherPreviewDiscount] = useState(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const defaultShippingFee = 30000;

  const shippingFee = (() => {
    if (!selectedFreeship) return defaultShippingFee;

    const cap =
      selectedFreeship.maxFreeship ??
      selectedFreeship.maxDiscount ??
      selectedFreeship.value ??
      selectedFreeship.discount ??
      defaultShippingFee;
    const freeshipAmount = Math.min(Number(cap) || 0, defaultShippingFee);
    return Math.max(0, defaultShippingFee - freeshipAmount);
  })();

  const freeshipAmount = Math.max(0, defaultShippingFee - shippingFee);
  const discountAmount = voucherPreviewDiscount?.discount ?? 0;
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  const selectedItemsCount = Array.isArray(cartItems) ? cartItems.length : 0;

  // Helper function to remove checked out items
  const removeCheckedOutItems = async () => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;
    
    const itemIdsToRemove = cartItems.map(item => item._id);
    
    await removeMultipleItems(itemIdsToRemove);
  };

  // Handle payment redirects
  useEffect(() => {
    const query = new URLSearchParams(location.search);

    // VNPay
    const success = query.get("success");
    const orderId = query.get("orderId");
    if (success === "false" && orderId) {
      toast.error("Thanh toán VNPay thất bại hoặc bị hủy!");
      localStorage.removeItem("pendingOrderData");
      navigate("/checkout");
      setLoading(false);
      return;
    } else if (success === "true" && orderId) {
      const orderData = JSON.parse(localStorage.getItem("pendingOrderData"));
      if (orderData) {
        setLoading(true);
        orderService.createOrder(orderData).then(async (res) => {
          if (res.success) {
            toast.success("Thanh toán VNPay thành công!");
            await removeCheckedOutItems(); 
            localStorage.removeItem("pendingOrderData");
            navigate("/user/orders");
          } else {
            toast.error("Lưu đơn hàng thất bại: " + res.message);
          }
          setLoading(false);
        });
      }
      return;
    }

    // ZaloPay
    const appTransId = query.get("apptransid");
    if (appTransId) {
      const pendingOrderData = JSON.parse(
        localStorage.getItem("pendingOrderData")
      );
      if (pendingOrderData) {
        setLoading(true);
        zalopayService.queryStatus(appTransId).then(async (statusRes) => {
          if (statusRes.success && statusRes.data?.return_code === 1) {
            const res = await orderService.createOrder(pendingOrderData);
            if (res.success) {
              toast.success("Thanh toán ZaloPay thành công!");
              await removeCheckedOutItems(); 
              localStorage.removeItem("pendingOrderData");
              navigate("/user/orders");
            } else {
              toast.error("Thanh toán thành công nhưng lưu đơn thất bại!");
            }
          } else {
            toast.error("Thanh toán ZaloPay thất bại!");
            localStorage.removeItem("pendingOrderData");
          }
          setLoading(false);
        });
      } else {
        toast.error("Thanh toán ZaloPay đã bị hủy!");
        localStorage.removeItem("pendingOrderData");
        navigate("/checkout");
        setLoading(false);
      }
    }
  }, [location, navigate]);

  const handleVoucherApplyFromModal = async (selection) => {
    setShowVoucherModal(false);
    const freeship = selection?.freeship ?? null;
    const discount = selection?.discount ?? null;

    setSelectedFreeship(freeship);
    setSelectedDiscount(discount);
    setVoucherPreviewDiscount(null);

    if (!discount || !discount.code) return;

    setApplyingVoucher(true);
    try {
      const res = await voucherService.apply(
        discount.code,
        subtotal,
        shippingFee
      );
      const payload = res || {};
      setVoucherPreviewDiscount({
        discount: payload.discount ?? payload.data?.discount ?? 0,
        finalAmount: payload.finalAmount ?? payload.data?.finalAmount ?? null,
      });
      toast.success('Áp dụng voucher thành công!');
    } catch (err) {
      console.error("Apply discount voucher failed", err);
      toast.error(
        err?.response?.data?.message || "Áp dụng voucher giảm giá thất bại"
      );
      setSelectedDiscount(null);
      setVoucherPreviewDiscount(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handlePayNow = async () => {
    if (!selectedAddress) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }
    if (!paymentMethod) {
      toast.error("Vui lòng chọn phương thức thanh toán");
      return;
    }
    if (selectedItemsCount === 0) {
      toast.error("Không có sản phẩm nào để thanh toán");
      return;
    }

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
        voucherCodes: {
          freeship: selectedFreeship ? selectedFreeship.code : undefined,
          discount: selectedDiscount ? selectedDiscount.code : undefined,
        },
        freeship_value: freeshipAmount,
        discount_value: discountAmount,
      };


      if (paymentMethod === "vnpay") {
        setLoading(true);
        const tempOrderId = new Date().getTime();
        orderData.orderId = tempOrderId;
        
        //     Store cart items in localStorage for later removal
        localStorage.setItem("pendingOrderData", JSON.stringify(orderData));
        localStorage.setItem("pendingCartItems", JSON.stringify(cartItems.map(i => i._id)));

        const { success, url, message } = await vnpayService.createPayment(
          orderData.orderId,
          total
        );

        if (success) {
          window.location.href = url;
        } else {
          setLoading(false);
          toast.error("Tạo thanh toán thất bại: " + message);
        }
      } else if (paymentMethod === "zalopay") {
        setLoading(true);
        const tempOrderId = new Date().getTime();
        orderData.orderId = tempOrderId;
        
        //     Store cart items in localStorage for later removal
        localStorage.setItem("pendingOrderData", JSON.stringify(orderData));
        localStorage.setItem("pendingCartItems", JSON.stringify(cartItems.map(i => i._id)));

        const { success, data, message } = await zalopayService.createPayment(
          orderData.orderId,
          total,
          "Thanh toan don hang qua ZaloPay"
        );

        if (success) {
          localStorage.setItem("zaloAppTransId", data.appTransId);
          window.location.href = data.paymentUrl;
        } else {
          setLoading(false);
          toast.error("Tạo thanh toán thất bại: " + message);
          localStorage.removeItem("pendingOrderData");
          localStorage.removeItem("pendingCartItems");
        }
      } else {
        // COD -> create order directly
        setLoading(true);
        const res = await orderService.createOrder(orderData);
        if (res.success) {
          toast.success("Đặt hàng thành công!");
          await removeCheckedOutItems(); 
          navigate("/user/orders");
        } else {
          toast.error("Đặt hàng thất bại: " + res.message);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("Create order error:", err);
      toast.error("Đặt hàng thất bại: " + err.message);
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
        {/*     Header with item count */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Sản phẩm đã chọn</h3>
          <span className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full">
            {selectedItemsCount} sản phẩm
          </span>
        </div>

        <div className="overflow-y-auto max-h-[500px] shadow rounded-xl bg-white custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-green-600 sticky top-0">
              <tr>
                <th className="py-3 px-4 text-white">Sản phẩm</th>
                <th className="py-3 px-4 text-white">Số lượng</th>
                <th className="py-3 px-6 text-right text-white">Đơn giá</th>
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
                    Chưa có sản phẩm nào được chọn
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Voucher selection */}
        <div
          onClick={() => setShowVoucherModal(true)}
          className="my-5 flex items-center justify-between border rounded-lg px-4 py-4 bg-white shadow-sm cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center gap-2">
            <img
              src={assets.promo_code_icon}
              alt="Voucher"
              className="w-6 h-6"
            />
            <span className="font-bold text-sm text-gray-800">
              PySpecials Voucher
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedFreeship || selectedDiscount ? (
              <>
                {selectedFreeship && (
                  <span className="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-2xl shadow-sm">
                    Miễn phí vận chuyển
                  </span>
                )}
                {selectedDiscount && (
                  <span className="px-3 py-1 text-sm font-semibold text-orange-700 bg-orange-100 rounded-2xl shadow-sm">
                    -
                    {(
                      voucherPreviewDiscount?.discount ??
                      selectedDiscount?.discount ??
                      selectedDiscount?.value ??
                      0
                    ).toLocaleString("vi-VN")}
                    ₫
                  </span>
                )}
              </>
            ) : (
              <span className="px-3 py-1 text-sm font-medium text-gray-600">
                Chọn voucher
              </span>
            )}
          </div>
        </div>

        {/* Price Summary */}
        <div className="space-y-3 text-sm border-t pt-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Tổng tiền hàng</span>
            <span className="font-medium">{subtotal.toLocaleString("vi-VN")}₫</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Phí vận chuyển</span>
            <span className="font-medium">{defaultShippingFee.toLocaleString("vi-VN")}₫</span>
          </div>

          {freeshipAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Giảm giá phí vận chuyển</span>
              <span className="text-green-600 font-medium">
                -{freeshipAmount.toLocaleString("vi-VN")}₫
              </span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Voucher giảm giá</span>
              <span className="text-orange-600 font-medium">
                -{discountAmount.toLocaleString("vi-VN")}₫
              </span>
            </div>
          )}

          <div className="flex justify-between font-semibold text-lg pt-3 border-t">
            <span>Tổng thanh toán</span>
            <span className="text-green-700">{total.toLocaleString("vi-VN")}₫</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="mt-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-green-600 focus:ring-0 cursor-pointer"
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
          disabled={!termsAccepted || loading || selectedItemsCount === 0}
          className={`w-3/4 font-bold text-white py-3 rounded-xl transition ${
            termsAccepted && selectedItemsCount > 0
              ? "bg-green-600 hover:bg-green-700 active:scale-95"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Đang xử lý..." : `Thanh toán ${selectedItemsCount} sản phẩm`}
        </button>
      </div>

      {/* Voucher Modal */}
      <VoucherModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        onApply={handleVoucherApplyFromModal}
        options={{ active: "true", limit: 100 }}
        subtotal={subtotal}
      />
    </div>
  );
};

export default CheckoutSummary;