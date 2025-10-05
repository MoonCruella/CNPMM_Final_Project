import api from './api';
import privateApi from './privateApi';

const BASE_URL = '/api/hometown-posts';

const blogService = {
  // Lấy tất cả bài viết blog với phân trang và lọc (Public endpoint)
  getAll: async (params = {}) => {
    try {
      const response = await api.get(BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching blogs:", error);
      throw error;
    }
  },

  // Lấy chi tiết bài viết theo slug hoặc ID (Public endpoint)
  getBySlug: async (slug) => {
    try {
      const response = await api.get(`${BASE_URL}/${slug}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching blog post:", error);
      throw error;
    }
  },

  // Lấy bài viết nổi bật (Public endpoint)
  getFeatured: async (limit = 5) => {
    try {
      const response = await api.get(`${BASE_URL}/featured`, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error("Error fetching featured blog posts:", error);
      throw error;
    }
  },

  // Lấy bài viết theo danh mục (Public endpoint)
  getByCategory: async (category, params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/category/${category}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${category} blog posts:`, error);
      throw error;
    }
  },
  
  // Lấy bài viết theo địa điểm (Public endpoint)
  getByLocation: async (district, params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/location/${district}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching blog posts for location ${district}:`, error);
      throw error;
    }
  },

  // Tìm kiếm bài viết (Public endpoint)
  search: async (query, params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/search`, { 
        params: { q: query, ...params } 
      });
      return response.data;
    } catch (error) {
      console.error("Error searching blog posts:", error);
      throw error;
    }
  },
  
  // === API cho Seller (cần xác thực) ===
  
  // Lấy tất cả bài viết của seller hiện tại
  getSellerPosts: async (params = {}) => {
    try {
      // Sử dụng route admin/all nhưng quyền hạn middleware sẽ lọc chỉ lấy bài viết của seller
      const response = await privateApi.get(`${BASE_URL}/admin/all`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching seller's blog posts:", error);
      throw error;
    }
  },
  
  // Tạo bài viết mới
  createPost: async (postData) => {
    try {
      const response = await privateApi.post(BASE_URL, postData);
      return response.data;
    } catch (error) {
      console.error("Error creating blog post:", error);
      throw error;
    }
  },
  
  // Cập nhật bài viết
  updatePost: async (id, postData) => {
    try {
      const response = await privateApi.put(`${BASE_URL}/${id}`, postData);
      return response.data;
    } catch (error) {
      console.error("Error updating blog post:", error);
      throw error;
    }
  },
  
  // Xóa bài viết
  deletePost: async (id) => {
    try {
      const response = await privateApi.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting blog post:", error);
      throw error;
    }
  },
  
  // Thay đổi trạng thái bài viết
  changeStatus: async (id, status) => {
    try {
      // Sử dụng update API với chỉ trường status
      const response = await privateApi.put(`${BASE_URL}/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error("Error changing blog post status:", error);
      throw error;
    }
  },
  
  // Upload hình ảnh cho bài viết
  uploadImage: async (formData) => {
    try {
      // Sử dụng API upload chung của hệ thống
      const response = await privateApi.post(`/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
      return response.data;
    } catch (error) {
      console.error("Error uploading blog image:", error);
      throw error;
    }
  }
};

export default blogService;