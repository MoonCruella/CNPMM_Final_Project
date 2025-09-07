import api from "./api.js";

class VnpayService {
  createPayment = async (orderId, amount) => {
    try {
      const response = await api.post("/api/vnpay/payment", { orderId, amount });
      if (response.data?.data?.paymentUrl) {
        return { success: true, url: response.data.data.paymentUrl };
      } else {
        throw new Error("Không nhận được URL thanh toán từ VNPay");
      }
    } catch (error) {
      console.error("VNPay createPayment error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Lỗi thanh toán VNPay",
      };
    }
  };
}

export default new VnpayService();
