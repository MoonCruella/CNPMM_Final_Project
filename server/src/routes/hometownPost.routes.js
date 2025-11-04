import express from "express";
import {
  createPost,
  getPosts,
  getPostDetail,
  updatePost,
  deletePost,
  getFeaturedPosts,
  getPostsByCategory,
  getPostsByLocation,
  searchPosts,
} from "../controllers/hometownPost.controller.js";
import {
  authenticateToken,
  checkAuth,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Routes công khai - không cần xác thực hoặc chỉ kiểm tra không bắt buộc
router.get("/", getPosts);
router.get("/featured", getFeaturedPosts);
router.get("/category/:category", getPostsByCategory);
router.get("/location/:district", getPostsByLocation);
router.get("/search", searchPosts);
router.get("/:identifier", getPostDetail); // Dùng checkAuth để biết user là ai, nhưng không bắt buộc đăng nhập

// Routes chỉ dành cho seller - dùng requireAdmin vì nó kiểm tra role === 'seller'
router.post("/", authenticateToken, requireAdmin, createPost);
router.put("/:id", authenticateToken, requireAdmin, updatePost);
router.delete("/:id", authenticateToken, requireAdmin, deletePost);

// Routes dành cho admin quản lý
router.get("/admin/all", authenticateToken, requireAdmin, getPosts);

export default router;
