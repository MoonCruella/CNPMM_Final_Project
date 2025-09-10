import api from "./api.js";

class ZaloPayService {
  createPayment = async (orderId, amount, description) => {
    try {
      const response = await api.post("/api/zalopay/payment", {
        orderId,
        amount,
        description,
      });
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      } else {
        throw new Error("Không nhận được URL thanh toán từ ZaloPay");
      }
    } catch (error) {
      console.error("ZaloPay createPayment error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Lỗi thanh toán ZaloPay",
      };
    }
  };

  queryStatus = async (appTransId) => {
    try {
      const response = await api.get(`/api/zalopay/query`, { params: { appTransId } });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Lỗi truy vấn ZaloPay",
      };
    }
  };
}

export default new ZaloPayService();
