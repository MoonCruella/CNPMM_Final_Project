import privateApi from "./privateApi.js";

class OrderService {
  // ✅ Get user orders with filter
  getUserOrders = async (status = "all", page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.append("status", status);
      params.append("page", page);
      params.append("limit", limit);

      const response = await privateApi.get(
        `/api/orders/user?${params.toString()}`
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      } else {
        throw new Error(
          response.data.message || "Không thể lấy danh sách đơn hàng"
        );
      }
    } catch (error) {
      console.error("Get user orders error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Có lỗi xảy ra khi lấy đơn hàng",
        error: error.message,
      };
    }
  };

  // ✅ Get order by ID
  getOrderById = async (orderId) => {
    try {
      const response = await privateApi.get(`/api/orders/${orderId}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      } else {
        throw new Error(
          response.data.message || "Không thể lấy thông tin đơn hàng"
        );
      }
    } catch (error) {
      console.error("Get order by ID error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Có lỗi xảy ra",
        error: error.message,
      };
    }
  };

  // ✅ Cancel order
  cancelOrder = async (orderId, reason = "") => {
    try {
      const response = await privateApi.put(`/api/orders/${orderId}/cancel`, {
        reason,
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Hủy đơn hàng thành công",
        };
      } else {
        throw new Error(response.data.message || "Không thể hủy đơn hàng");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Có lỗi xảy ra khi hủy đơn hàng",
        error: error.message,
      };
    }
  };

  // ✅ Reorder
  reorder = async (orderId) => {
    try {
      const response = await privateApi.post(`/api/orders/${orderId}/reorder`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Đã thêm sản phẩm vào giỏ hàng",
        };
      } else {
        throw new Error(response.data.message || "Không thể đặt lại đơn hàng");
      }
    } catch (error) {
      console.error("Reorder error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Có lỗi xảy ra khi đặt lại đơn hàng",
        error: error.message,
      };
    }
  };

  // ✅ Create new order
  createOrder = async (orderData) => {
    try {
      const response = await privateApi.post("/api/orders", orderData);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Đặt hàng thành công",
        };
      } else {
        throw new Error(response.data.message || "Không thể tạo đơn hàng");
      }
    } catch (error) {
      console.error("Create order error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Có lỗi xảy ra khi đặt hàng",
        error: error.message,
      };
    }
  };
}

export default new OrderService();
