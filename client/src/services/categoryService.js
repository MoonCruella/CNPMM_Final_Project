// src/services/categoryService.js
import api from "./api";

const categoryService = {
  // Lấy tất cả categories
  getAll: async () => {
    const res = await api.get("/api/categories");
    return res.data;
  },

  // Lấy chi tiết 1 category
  getById: async (id) => {
    const res = await api.get(`/api/categories/${id}`);
    return res.data;
  },

  // Tạo mới category
  create: async (values) => {
    const res = await api.post("/api/categories", values);
    return res.data;
  },

  // Cập nhật category
  update: async (id, values) => {
    const res = await api.put(`/api/categories/${id}`, values);
    return res.data;
  },

  // Xóa category
  delete: async (id) => {
    const res = await api.delete(`/api/categories/${id}`);
    return res.data;
  },
};

export default categoryService;
