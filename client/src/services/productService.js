import api from "./api";

const productService = {
  // Lấy tất cả products
  getAll: async () => {
    const res = await api.get("/api/products");
    return res.data;
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
    const res = await api.get("api/products/discounts?limit=4");
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`api/products/${id}`);
    return res.data;
  },
  toggleFavorite: async (productId) => {
    try {
      const response = await api.post(`/api/products/${productId}/favorite`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // Lấy danh sách sản phẩm yêu thích
  getFavorites: async (page = 1, limit = 12) => {
    try {
      const response = await api.get(
        `/api/products/favorites?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách sản phẩm đã xem gần đây
  getViewedProducts: async (page = 1, limit = 12) => {
    try {
      const response = await api.get(
        `/api/products/viewed?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default productService;
