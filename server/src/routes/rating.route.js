import express from "express";
import {
  createRating,
  getRatingsByProduct,
  deleteRating,
  updateRating,
  getProductAverageRating,
  getAllRatings,
} from "../controllers/rating.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Tạo Rating cho product (cần login)
router.post("/", authenticateToken, createRating);

// Lấy Rating trung bình của 1 product
router.get("/average/:productId", getProductAverageRating);

// Lấy tất cả Rating của 1 product (có phân trang)
router.get("/:productId", getRatingsByProduct);

// Cập nhật Rating (chính chủ hoặc admin)
router.put("/:id", authenticateToken, updateRating);

// Xoá Rating (chính chủ hoặc admin)
router.delete("/:id", authenticateToken, deleteRating);

//Lấy tất cả rating (admin)
router.get("/", authenticateToken, getAllRatings);

export default router;