import api from "./api";

const productService = {
  // Lấy tất cả products
  getAll: async (params = {}) => {
    try {
      // Build query string from params
      const queryString = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryString.append(key, value);
        }
      });

      const url = `/api/products${queryString.toString() ? `?${queryString.toString()}` : ''}`;
      
      console.log('📡 productService.getAll URL:', url);
      
      const res = await api.get(url);
      return res.data;
    } catch (error) {
      console.error("Error in productService.getAll:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể tải sản phẩm",
        error: error.message
      };
    }
  },

  // Lấy 8 sản phẩm bán chạy nhất
  getBestSeller: async () => {
    const res = await api.get("/api/products/best-sellers?limit=8");
    return res.data;
  },

  // Lấy 8 sản phẩm mới nhất
  getNewest: async () => {
    const res = await api.get("/api/products/newest?limit=8");
    return res.data;
  },

  // Lấy 4 sản phẩm giảm giá sâu nhất
  getBestDiscount: async () => {
    const res = await api.get("/api/products/discounts?limit=4");
    return res.data;
  },

  // Lấy sản phẩm theo id
  getById: async (id) => {
    const res = await api.get(`/api/products/${id}`);
    return res.data;
  },

  // Tạo sản phẩm mới
  create: async (data) => {
    const res = await api.post("/api/products", data);
    return res.data;
  },

  // Cập nhật sản phẩm
  update: async (id, data) => {
    const res = await api.put(`/api/products/${id}`, data);
    return res.data;
  },

  // Xóa sản phẩm
  remove: async (id) => {
    const res = await api.delete(`/api/products/${id}`);
    return res.data;
  },

  // Toggle yêu thích
  toggleFavorite: async (productId) => {
    const res = await api.post(`/api/products/${productId}/favorite`);
    return res.data;
  },

  // Lấy danh sách sản phẩm yêu thích
  getFavorites: async (page = 1, limit = 12) => {
    const res = await api.get(`/api/products/favorites?page=${page}&limit=${limit}`);
    return res.data;
  },

  // Lấy danh sách sản phẩm đã xem gần đây
  getViewedProducts: async (page = 1, limit = 12) => {
    const res = await api.get(`/api/products/viewed?page=${page}&limit=${limit}`);
    return res.data;
  },
};

export default productService;
