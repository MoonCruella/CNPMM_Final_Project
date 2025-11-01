import privateApi from "./privateApi.js";

class OrderService {
  //  Get user orders with filter
  getUserOrders = async (status = "all", page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status !== "all") {
      params.append("status", status);
    }

      const response = await privateApi.get(
        `/api/orders/user?${params.toString()}`
      );

      if (response.data.success) {
        console.log("Get user orders response Service:", response.data);
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
  getAllOrder = async (status = "all", page = 1, limit = 10, startDate = null, endDate = null, sort = "created_at", order = "desc") => {
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.append("status", status);
      params.append("page", page);
      params.append("limit", limit);
      params.append("sort", sort);
      params.append("order", order);

      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }

      const response = await privateApi.get(
        `/api/orders/all?${params.toString()}`
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
  updateShippingStatus = async (orderId, newStatus) => {
    try {
      const response = await privateApi.put(`/api/orders/${orderId}/shipping`, {
        shipping_status: newStatus,
      });
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message:
            response.data.message ||
            "Cập nhật trạng thái vận chuyển thành công",
        };
      } else {
        throw new Error(
          response.data.message || "Không thể cập nhật trạng thái vận chuyển"
        );
      }
    } catch (error) {
      console.error("Update shipping status error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật trạng thái vận chuyển",
        error: error.message,
      };
    }
  };

  // Get order by ID
  sale_price = async (orderId) => {
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

  //  Cancel order
  cancelOrder = async (orderId, reason = "") => {
    try {
      const response = await privateApi.put(`/api/orders/${orderId}/cancel`, {
        reason,
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
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

  // Reorder
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

  // Create new order
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
  searchOrders = async (searchParams = {}, isMyOrders = false) => {
    try {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });

      const endpoint = isMyOrders
        ? "/api/orders/my-orders/search"
        : "/api/orders/search";
      const response = await privateApi.get(`${endpoint}?${params.toString()}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      } else {
        throw new Error(response.data.message || "Không thể tìm kiếm đơn hàng");
      }
    } catch (error) {
      console.error("Search orders error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Có lỗi xảy ra khi tìm kiếm",
        error: error.message,
      };
    }
  };
  searchOrderAdmin = async (queryOrParams, status, page, limit, startDate, endDate) => {
    try {
      let params = {};

      if (typeof queryOrParams === 'object' && queryOrParams !== null) {
        params = queryOrParams;
      } else {
        params = {
          q: queryOrParams,
          status: status !== 'all' ? status : undefined,
          page,
          limit,
          startDate,
          endDate,
          sort: 'created_at', 
          order: 'desc'      
        };
      }

      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== "all") {
          qs.append(k, v);
        }
      });

      console.log('🔍 searchOrderAdmin params:', Object.fromEntries(qs));

      const response = await privateApi.get(`/api/orders/search?${qs.toString()}`);

      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Không thể tìm kiếm đơn hàng",
        };
      }
    } catch (error) {
      console.error("searchOrderAdmin error:", error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Có lỗi khi tìm kiếm",
        error,
      };
    }
  };
  
  getUserOrdersByAdmin = async (
    status = "all",
    page = 1,
    limit = 10,
    userId
  ) => {
    try {
      // safer: ensure userId, encode và let axios handle params
      if (!userId) {
        throw new Error("Missing userId");
      }

      const response = await privateApi.get(
        `/api/orders/user/${encodeURIComponent(String(userId))}`,
        {
          params: { status, page, limit },
        }
      );

      if (response.data.success) {
        console.log("Get user orders response Service:", response.data);
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
  getOrderById = async (orderId) => {
    try {
      const response = await privateApi.get(`/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Get order by ID error:", error);
      throw error;
    }
  };
}
export default new OrderService();
