import api from "./api";

const ratingService = {
  getRatingsByProduct: async (productId, page = 1, limit = 5) => {
    const res = await api.get(
      `/api/ratings/${productId}?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  getProductAverageRating: async (productId) => {
    const res = await api.get(`/api/ratings/average/${productId}`);
    return res.data;
  },

  createRating: async (data) => {
    const res = await api.post(`/api/ratings`, data);
    return res.data;
  },

  deleteRating: async (ratingId) => {
    const res = await api.delete(`/api/ratings/${ratingId}`);
    return res.data;
  },

  updateRating: async (ratingId, data) => {
    const res = await api.put(`/api/ratings/${ratingId}`, data);
    return res.data;
  },

  getAll: async (params) => {
    const res = await api.get("/api/ratings", { params });
    return res.data;
  },
};

export default ratingService;