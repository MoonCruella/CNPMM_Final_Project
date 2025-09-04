import privateApi from "./privateApi";

const cartService = {
  // 1. Lấy giỏ hàng
  getCart: async () => {
    const res = await privateApi.get("/api/cart");
    return res.data;
  },

  // 2. Thêm sản phẩm vào giỏ
  addToCart: async (product_id, quantity = 1) => {
    const res = await privateApi.post("/api/cart", { product_id, quantity });
    return res.data;
  },

  // 3. Cập nhật một sản phẩm
  updateCartItem: async (cartItem_id, quantity) => {
    const res = await privateApi.put(`/api/cart/${cartItem_id}`, { quantity });
    return res.data;
  },

  // 4. Xóa một sản phẩm
  removeFromCart: async (cartItem_id) => {
    const res = await privateApi.delete(`/api/cart/${cartItem_id}`);
    return res.data;
  },

  // 5. Xóa toàn bộ giỏ
  clearCart: async () => {
    const res = await privateApi.delete("/api/cart");
    return res.data;
  },
};

export default cartService;
