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
};

export default productService;
